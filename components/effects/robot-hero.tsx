"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { createStage, watchTheme, damp } from "@/components/effects/three/stage";
import { PRELOADER_DONE_EVENT } from "@/components/layout/preloader";

/**
 * "RobotExpressive" by Tomás Laulhé (Quaternius), modified by Don McCurdy.
 * CC0 1.0, from the three.js examples repository.
 */
const MODEL_URL = "/models/robot.glb";

/** Elements tagged data-robot="<Animation>" make the robot react on hover. */
const HOVER_ATTRIBUTE = "data-robot";

/** Clips that play once over the looping Idle. */
type OneShot = "Wave" | "ThumbsUp" | "Yes" | "Dance" | "Jump";
const CLICK_ROTATION: OneShot[] = ["Dance", "Jump", "ThumbsUp", "Yes"];

/** Seconds between unprompted gestures while idle, so it never looks frozen. */
const AMBIENT_MIN = 14;
const AMBIENT_MAX = 22;

/** Head tracking limits in radians. */
const MAX_YAW = 0.75;
const MAX_PITCH = 0.35;
/** Resting body turn: angled toward the headline, as if presenting it. */
const BASE_YAW = -0.28;

const luminance = (c: THREE.Color) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;

/**
 * An animated robot standing in the hero. Waves as it appears, follows the
 * cursor with its head, reacts to hovering the hero buttons, dances when
 * clicked, and jumps as the page scrolls into hyperspace.
 *
 * Desktop only: below 1024px the model is never downloaded.
 */
export default function RobotHero() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !window.matchMedia("(min-width: 1024px)").matches) return;

        let disposed = false;
        let mixer: THREE.AnimationMixer | null = null;
        let robot: THREE.Object3D | null = null;
        let headBone: THREE.Bone | null = null;
        const hitBox = new THREE.Box3();
        /** Posed model bounds; null until loaded, which makes early resizes a no-op. */
        let fitBox: THREE.Box3 | null = null;

        const stage = createStage(canvas, {
            fov: 30,
            near: 0.1,
            far: 100,
            maxDpr: 2,
            antialias: true,
            onResize: () => fitCamera(),
            onFrame: ({ dt, elapsed, reducedMotion }) => frame(dt, elapsed, reducedMotion),
        });
        if (!stage) return;

        // --- Lighting: soft fill, a key light, and a strong rim for silhouette.
        const hemi = new THREE.HemisphereLight(0xffffff, 0x1a1a1a, 1);
        const key = new THREE.DirectionalLight(0xffffff, 2.2);
        key.position.set(3, 5, 6);
        const rim = new THREE.DirectionalLight(0xffffff, 3.5);
        rim.position.set(-4, 4, -5);
        stage.scene.add(hemi, key, rim);

        const stopTheme = watchTheme((isDark) => {
            hemi.intensity = isDark ? 0.9 : 1.5;
            rim.intensity = isDark ? 3.5 : 1.2;
        });

        // --- Animation state ---------------------------------------------
        const actions = new Map<string, THREE.AnimationAction>();
        let idle: THREE.AnimationAction | null = null;
        let busy = false;
        let clickIndex = 0;
        let nextAmbient = AMBIENT_MIN + Math.random() * (AMBIENT_MAX - AMBIENT_MIN);
        let trackingWeight = 1;
        let greeted = false;

        const playOnce = (name: OneShot) => {
            const action = actions.get(name);
            if (!action || !idle || busy) return;
            busy = true;
            action.reset().setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = true;
            action.crossFadeFrom(idle, 0.25, false).play();
        };

        const onFinished = (event: { action: THREE.AnimationAction }) => {
            if (!idle) return;
            idle.reset().play();
            idle.crossFadeFrom(event.action, 0.35, false);
            busy = false;
        };

        const greet = () => {
            if (greeted || !mixer) return;
            greeted = true;
            playOnce("Wave");
        };

        // --- Load the model ----------------------------------------------
        new GLTFLoader().load(MODEL_URL, (gltf) => {
            if (disposed) return;
            robot = gltf.scene;

            // Monochrome to match the grayscale photos; the rim light does the rest.
            robot.traverse((object) => {
                const mesh = object as THREE.Mesh;
                if (!mesh.isMesh) return;
                const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                materials.forEach((material) => {
                    const standard = material as THREE.MeshStandardMaterial;
                    if (!standard.color) return;
                    const gray = luminance(standard.color);
                    standard.color.setRGB(gray, gray, gray);
                    standard.emissive?.setRGB(0, 0, 0);
                    standard.metalness = 0.35;
                    standard.roughness = 0.45;
                });
            });
            // Two nodes are named "Head" (the mesh and the bone); tracking needs the bone.
            robot.traverse((object) => {
                if ((object as THREE.Bone).isBone && object.name === "Head") headBone = object as THREE.Bone;
            });

            robot.rotation.y = BASE_YAW;
            stage.scene.add(robot);

            mixer = new THREE.AnimationMixer(robot);
            gltf.animations.forEach((clip) => actions.set(clip.name, mixer!.clipAction(clip)));
            idle = actions.get("Idle") ?? null;
            idle?.play();
            mixer.addEventListener("finished", onFinished);

            // Measure the *posed* skinned mesh: the bind pose and unskinned
            // geometry bounds both understate the model's real size.
            mixer.update(0);
            robot.updateMatrixWorld(true);
            fitBox = new THREE.Box3().setFromObject(robot, true);
            hitBox.copy(fitBox);
            fitCamera();

            setReady(true);

            // Wave now if the preloader is already gone, otherwise when it lifts.
            if (document.documentElement.dataset.preloaded === "true") greet();
        }, undefined, (error) => {
            // The hero stays usable without the robot, but a failure must not be
            // silent: GLTFLoader also routes exceptions from onLoad through here.
            console.warn("[robot] failed to load or set up the model", error);
        });

        window.addEventListener(PRELOADER_DONE_EVENT, greet);

        // --- Inputs -------------------------------------------------------
        const pointer = new THREE.Vector2(0, 0.2);
        const raycaster = new THREE.Raycaster();

        const toNdc = (event: PointerEvent) => {
            const rect = canvas.getBoundingClientRect();
            return new THREE.Vector2(
                ((event.clientX - rect.left) / rect.width) * 2 - 1,
                -(((event.clientY - rect.top) / rect.height) * 2 - 1),
            );
        };

        const onPointerMove = (event: PointerEvent) => pointer.copy(toNdc(event));

        // The canvas ignores pointer events so it never blocks the text or
        // buttons; clicks are hit-tested against the robot here instead.
        const onPointerDown = (event: PointerEvent) => {
            if (!robot || (event.target as Element).closest("a, button, input")) return;
            raycaster.setFromCamera(toNdc(event), stage.camera);
            if (!raycaster.ray.intersectsBox(hitBox)) return;
            playOnce(CLICK_ROTATION[clickIndex % CLICK_ROTATION.length]);
            clickIndex += 1;
        };

        const onPointerOver = (event: PointerEvent) => {
            const tagged = (event.target as Element).closest(`[${HOVER_ATTRIBUTE}]`);
            const clip = tagged?.getAttribute(HOVER_ATTRIBUTE) as OneShot | null;
            if (clip) playOnce(clip);
        };

        // First scroll into the warp makes it jump, as if launching with it.
        let jumped = false;
        const onScroll = () => {
            if (jumped || window.scrollY / window.innerHeight < 0.06) return;
            jumped = true;
            playOnce("Jump");
        };

        window.addEventListener("pointermove", onPointerMove, { passive: true });
        window.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("pointerover", onPointerOver);
        window.addEventListener("scroll", onScroll, { passive: true });

        // --- Framing ------------------------------------------------------
        const fitSize = new THREE.Vector3();
        const fitCenter = new THREE.Vector3();

        /** Fits the whole robot in the canvas, whichever of width or height binds. */
        function fitCamera() {
            if (!fitBox) return;
            const camera = stage!.camera;
            fitBox.getSize(fitSize);
            fitBox.getCenter(fitCenter);

            const vFov = THREE.MathUtils.degToRad(camera.fov);
            const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
            // Margins leave room for the arms in Dance and the height of Jump.
            const byHeight = (fitSize.y * 1.25) / (2 * Math.tan(vFov / 2));
            const byWidth = (fitSize.x * 1.4) / (2 * Math.tan(hFov / 2));
            const distance = Math.max(byHeight, byWidth) + fitSize.z / 2;

            // Aim slightly above centre so the feet sit low with headroom above.
            const aimY = fitCenter.y + fitSize.y * 0.08;
            camera.position.set(fitCenter.x, aimY, fitCenter.z + distance);
            camera.lookAt(fitCenter.x, aimY, fitCenter.z);
        }

        // --- Frame --------------------------------------------------------
        const headScreen = new THREE.Vector3();
        const trackEuler = new THREE.Euler(0, 0, 0, "YXZ");
        const trackQuat = new THREE.Quaternion();
        let yaw = 0;
        let pitch = 0;
        let ambientClock = 0;

        function frame(dt: number, _elapsed: number, reducedMotion: boolean) {
            if (!mixer || !robot) return;

            // Reduced motion: hold the idle pose and skip the gestures.
            mixer.update(reducedMotion ? 0 : dt);
            if (reducedMotion) return;

            // Occasional unprompted gesture while nothing else is happening.
            ambientClock += dt;
            if (!busy && ambientClock > nextAmbient) {
                ambientClock = 0;
                nextAmbient = AMBIENT_MIN + Math.random() * (AMBIENT_MAX - AMBIENT_MIN);
                playOnce(Math.random() < 0.5 ? "Wave" : "Yes");
            }

            // Let big full-body clips own the head; track the cursor otherwise.
            trackingWeight = damp(trackingWeight, busy ? 0.25 : 1, 5, dt);

            if (headBone) {
                headBone.getWorldPosition(headScreen).project(stage!.camera);
                const targetYaw = THREE.MathUtils.clamp((pointer.x - headScreen.x) * 1.1, -MAX_YAW, MAX_YAW);
                const targetPitch = THREE.MathUtils.clamp((headScreen.y - pointer.y) * 0.6, -MAX_PITCH, MAX_PITCH);
                yaw = damp(yaw, targetYaw * trackingWeight, 6, dt);
                pitch = damp(pitch, targetPitch * trackingWeight, 6, dt);

                // Applied after the mixer, on top of whatever the clip set this frame.
                trackEuler.set(pitch, yaw, 0);
                trackQuat.setFromEuler(trackEuler);
                headBone.quaternion.multiply(trackQuat);
            }

            // The body follows a little, so the whole figure feels aware.
            robot.rotation.y = damp(robot.rotation.y, BASE_YAW + yaw * 0.3, 3, dt);
        }

        return () => {
            disposed = true;
            window.removeEventListener(PRELOADER_DONE_EVENT, greet);
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("pointerover", onPointerOver);
            window.removeEventListener("scroll", onScroll);
            mixer?.removeEventListener("finished", onFinished);
            mixer?.stopAllAction();
            stopTheme();
            stage.dispose();
        };
    }, []);

    return (
        <div
            aria-hidden="true"
            className={`absolute inset-0 transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}
        >
            {/* Stage light pooling on the floor beneath the robot. */}
            <div className="absolute bottom-[4%] left-1/2 -translate-x-1/2 w-[70%] h-[12%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,var(--color-foreground)_0%,transparent_70%)] opacity-[0.07]" />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        </div>
    );
}
