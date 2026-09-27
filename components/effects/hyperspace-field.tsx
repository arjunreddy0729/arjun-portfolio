"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createStage, watchTheme, clamp01, damp } from "@/components/effects/three/stage";
import { InteractiveParticles } from "@/components/effects/interactive-particles";
import { PRELOADER_DONE_EVENT } from "@/components/layout/preloader";

/** Depth of the particle tunnel in world units; particles wrap from front to back. */
const DEPTH = 40;
const SPREAD_X = 30;
const SPREAD_Y = 18;
/** Drift speed at rest, and extra speed added at full warp (units per second). */
const BASE_SPEED = 0.9;
const WARP_SPEED = 95;
/** Seconds to decelerate out of hyperspace once the preloader lifts. */
const INTRO_SECONDS = 1.9;

/**
 * Clip-space lensing shared by points and streaks: pushes geometry away from
 * the cursor with a slight swirl, so moving the mouse visibly bends space.
 */
const BEND_GLSL = /* glsl */ `
    uniform vec2 uMouse;
    uniform float uMouseStrength;
    uniform float uAspect;

    vec4 bend(vec4 clip) {
        vec2 ndc = clip.xy / clip.w;
        vec2 d = ndc - uMouse;
        d.x *= uAspect;
        float r2 = dot(d, d);
        float falloff = exp(-r2 * 5.0) * uMouseStrength;
        vec2 dir = r2 > 1e-6 ? d * inversesqrt(r2) : vec2(0.0);
        vec2 offset = (dir * 0.11 + vec2(-dir.y, dir.x) * 0.06) * falloff;
        offset.x /= uAspect;
        clip.xy += offset * clip.w;
        return clip;
    }
`;

const TRAVEL_GLSL = /* glsl */ `
    uniform float uTravel;
    uniform float uDepth;

    float travelZ(float baseZ) {
        return -uDepth + mod(baseZ + uTravel, uDepth);
    }

    // Fade in from the far plane and out just before the camera, so particles
    // never pop into existence or balloon across the lens.
    float depthFade(float z) {
        return smoothstep(-uDepth, -uDepth * 0.78, z) * (1.0 - smoothstep(-3.0, -0.6, z));
    }
`;

const POINTS_VERTEX = /* glsl */ `
    ${BEND_GLSL}
    ${TRAVEL_GLSL}
    uniform float uTime;
    uniform float uSize;
    uniform float uPixelRatio;
    uniform float uWarp;
    attribute float aSeed;
    attribute float aScale;
    varying float vAlpha;

    void main() {
        float z = travelZ(position.z);
        vec4 mv = modelViewMatrix * vec4(position.xy, z, 1.0);
        gl_Position = bend(projectionMatrix * mv);

        float twinkle = 0.65 + 0.35 * sin(uTime * (0.6 + aSeed * 1.4) + aSeed * 40.0);
        vAlpha = depthFade(z) * twinkle * (1.0 - uWarp * 0.75);

        float depth = max(-mv.z, 0.1);
        gl_PointSize = min(uSize * aScale * uPixelRatio * (14.0 / depth), 7.0 * uPixelRatio);
    }
`;

const POINTS_FRAGMENT = /* glsl */ `
    uniform vec3 uColor;
    uniform float uOpacity;
    varying float vAlpha;

    void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        gl_FragColor = vec4(uColor, smoothstep(0.5, 0.0, d) * vAlpha * uOpacity);
    }
`;

const STREAKS_VERTEX = /* glsl */ `
    ${BEND_GLSL}
    ${TRAVEL_GLSL}
    uniform float uWarp;
    uniform float uStreak;
    attribute float aTail;
    attribute float aScale;
    varying float vAlpha;

    void main() {
        float z = travelZ(position.z);
        // The tail trails behind the head along z; perspective turns these
        // parallel lines into streaks radiating from the vanishing point.
        float tailZ = z - aTail * uStreak * (0.4 + aScale * 0.6);
        gl_Position = bend(projectionMatrix * modelViewMatrix * vec4(position.xy, tailZ, 1.0));
        vAlpha = depthFade(z) * uWarp * (1.0 - aTail);
    }
`;

const STREAKS_FRAGMENT = /* glsl */ `
    uniform vec3 uColor;
    uniform float uOpacity;
    varying float vAlpha;

    void main() {
        gl_FragColor = vec4(uColor, vAlpha * uOpacity);
    }
`;

function hasWebGL(): boolean {
    try {
        const canvas = document.createElement("canvas");
        return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    } catch {
        return false;
    }
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * 3D starfield behind the hero. Drifts toward the camera at rest, bends away
 * from the cursor, and accelerates into light-speed streaks as the next
 * section scrolls up over the pinned hero. On first load it decelerates out
 * of hyperspace as the preloader lifts.
 *
 * Falls back to the 2D particle canvas when WebGL is unavailable.
 */
export default function HyperspaceField() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [supported] = useState(hasWebGL);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !supported) return;

        const isMobile = window.matchMedia("(max-width: 767px)").matches;
        const count = isMobile ? 1500 : 3200;

        // Per-particle data shared by both layers.
        const base = new Float32Array(count * 3);
        const seeds = new Float32Array(count);
        const scales = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            base[i * 3] = (Math.random() * 2 - 1) * SPREAD_X;
            base[i * 3 + 1] = (Math.random() * 2 - 1) * SPREAD_Y;
            base[i * 3 + 2] = Math.random() * DEPTH;
            seeds[i] = Math.random();
            scales[i] = 0.5 + Math.random();
        }

        const uniforms = {
            uTravel: { value: 0 },
            uDepth: { value: DEPTH },
            uTime: { value: 0 },
            uSize: { value: 3.0 },
            uPixelRatio: { value: 1 },
            uWarp: { value: 0 },
            uStreak: { value: 0 },
            uMouse: { value: new THREE.Vector2(0, 0) },
            uMouseStrength: { value: 0 },
            uAspect: { value: 1 },
            uColor: { value: new THREE.Color(1, 1, 1) },
            uOpacity: { value: 0.9 },
        };

        const stage = createStage(canvas, {
            fov: 60,
            near: 0.1,
            far: DEPTH + 10,
            maxDpr: 1.5,
            onResize: (width, height) => {
                uniforms.uAspect.value = width / height;
                uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 1.5);
            },
            onFrame: ({ dt, elapsed, reducedMotion }) => frame(dt, elapsed, reducedMotion),
        });
        if (!stage) return;

        // Points: the resting starfield.
        const pointsGeometry = new THREE.BufferGeometry();
        pointsGeometry.setAttribute("position", new THREE.BufferAttribute(base, 3));
        pointsGeometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
        pointsGeometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));

        const points = new THREE.Points(
            pointsGeometry,
            new THREE.ShaderMaterial({
                uniforms,
                vertexShader: POINTS_VERTEX,
                fragmentShader: POINTS_FRAGMENT,
                transparent: true,
                depthWrite: false,
            }),
        );
        points.frustumCulled = false;

        // Streaks: two vertices per particle (head, tail), visible only in warp.
        const streakBase = new Float32Array(count * 6);
        const streakTail = new Float32Array(count * 2);
        const streakScale = new Float32Array(count * 2);
        for (let i = 0; i < count; i++) {
            for (let v = 0; v < 2; v++) {
                streakBase.set(base.subarray(i * 3, i * 3 + 3), (i * 2 + v) * 3);
                streakTail[i * 2 + v] = v;
                streakScale[i * 2 + v] = scales[i];
            }
        }

        const streakGeometry = new THREE.BufferGeometry();
        streakGeometry.setAttribute("position", new THREE.BufferAttribute(streakBase, 3));
        streakGeometry.setAttribute("aTail", new THREE.BufferAttribute(streakTail, 1));
        streakGeometry.setAttribute("aScale", new THREE.BufferAttribute(streakScale, 1));

        const streaks = new THREE.LineSegments(
            streakGeometry,
            new THREE.ShaderMaterial({
                uniforms,
                vertexShader: STREAKS_VERTEX,
                fragmentShader: STREAKS_FRAGMENT,
                transparent: true,
                depthWrite: false,
            }),
        );
        streaks.frustumCulled = false;

        stage.scene.add(streaks, points);
        const lookTarget = new THREE.Vector3(0, 0, -20);

        // --- Inputs -------------------------------------------------------
        const mouseTarget = new THREE.Vector2(0, 0);
        let mouseInside = 0;
        let rect = canvas.getBoundingClientRect();

        const onPointerMove = (event: PointerEvent) => {
            rect = canvas.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width;
            const y = (event.clientY - rect.top) / rect.height;
            mouseTarget.set(x * 2 - 1, -(y * 2 - 1));
            mouseInside = x >= 0 && x <= 1 && y >= 0 && y <= 1 ? 1 : 0;
        };
        const onPointerLeave = () => { mouseInside = 0; };

        // The hero is pinned; the next section covers it across one viewport.
        let scrollProgress = 0;
        const onScroll = () => { scrollProgress = clamp01(window.scrollY / window.innerHeight); };
        onScroll();

        window.addEventListener("pointermove", onPointerMove, { passive: true });
        document.documentElement.addEventListener("pointerleave", onPointerLeave);
        window.addEventListener("scroll", onScroll, { passive: true });

        // Hold at full warp behind the preloader, then decelerate out of it.
        let introStart: number | null = null;
        let introRequested = document.documentElement.dataset.preloaded === "true";
        const onPreloaded = () => { introRequested = true; };
        window.addEventListener(PRELOADER_DONE_EVENT, onPreloaded);

        const stopTheme = watchTheme((isDark) => {
            if (isDark) uniforms.uColor.value.setRGB(1, 1, 1);
            else uniforms.uColor.value.setRGB(0.07, 0.07, 0.07);
            uniforms.uOpacity.value = isDark ? 0.9 : 0.6;
        });

        // --- Frame --------------------------------------------------------
        let warp = 1;
        let travel = 0;

        function frame(dt: number, elapsed: number, reducedMotion: boolean) {
            uniforms.uTime.value = elapsed;

            let introWarp = 0;
            if (!reducedMotion) {
                if (introRequested && introStart === null) introStart = elapsed;
                introWarp = introStart === null
                    ? 1
                    : 1 - easeOutCubic(clamp01((elapsed - introStart) / INTRO_SECONDS));
            }

            // Full warp by the time the next section covers ~55% of the hero.
            const t = clamp01(scrollProgress / 0.55);
            const scrollWarp = t * t * (3 - 2 * t);
            const target = reducedMotion ? 0 : Math.max(scrollWarp, introWarp);

            // Snap to the intro value while it drives; smooth otherwise.
            warp = introWarp > scrollWarp ? target : damp(warp, target, 6, dt);
            uniforms.uWarp.value = warp;
            uniforms.uStreak.value = Math.pow(warp, 1.5) * 6;

            const speed = reducedMotion ? 0 : BASE_SPEED + warp * warp * WARP_SPEED;
            travel = (travel + speed * dt) % DEPTH;
            uniforms.uTravel.value = travel;

            uniforms.uMouse.value.x = damp(uniforms.uMouse.value.x, mouseTarget.x, 8, dt);
            uniforms.uMouse.value.y = damp(uniforms.uMouse.value.y, mouseTarget.y, 8, dt);
            uniforms.uMouseStrength.value = damp(
                uniforms.uMouseStrength.value,
                reducedMotion ? 0 : mouseInside * (1 - warp),
                4,
                dt,
            );

            // Gentle camera parallax toward the cursor for real depth.
            const camera = stage!.camera;
            camera.position.x = damp(camera.position.x, uniforms.uMouse.value.x * 0.9, 3, dt);
            camera.position.y = damp(camera.position.y, uniforms.uMouse.value.y * 0.6, 3, dt);
            camera.lookAt(lookTarget);
        }

        return () => {
            window.removeEventListener("pointermove", onPointerMove);
            document.documentElement.removeEventListener("pointerleave", onPointerLeave);
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener(PRELOADER_DONE_EVENT, onPreloaded);
            stopTheme();
            stage.dispose();
        };
    }, [supported]);

    if (!supported) return <InteractiveParticles />;

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />
    );
}
