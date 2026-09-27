"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createStage, watchTheme, clamp01, damp } from "@/components/effects/three/stage";

export type CoreMode = "idle" | "listening" | "thinking" | "answering";

const RADIUS = 1.6;
const NODE_COUNT = 90;
/** Each neuron wires to this many of its nearest neighbours. */
const NEIGHBOURS = 3;
/** Seconds for the answer scan wave to sweep bottom to top. */
const PULSE_SECONDS = 1.4;

/** How agitated the network is in each mode: 0 calm, 1 fully thinking. */
const AGITATION: Record<CoreMode, number> = {
    idle: 0,
    listening: 0.25,
    thinking: 1,
    answering: 0.35,
};

/**
 * Shared by points and connections so neurons and their wires move as one.
 * Displacement is along the radial direction: layered sine noise that grows
 * with agitation, plus a band that sweeps upward when an answer lands.
 */
const DISPLACE_GLSL = /* glsl */ `
    uniform float uTime;
    uniform float uAgitation;
    uniform float uPulse;
    uniform float uPulseProgress;

    float wobble(vec3 p, float t) {
        return sin(p.x * 3.1 + t * 1.3) * sin(p.y * 2.7 - t * 1.1) * sin(p.z * 3.3 + t * 0.9);
    }

    float pulseBand(vec3 dir) {
        float front = mix(-1.3, 1.3, uPulseProgress);
        return exp(-pow(dir.y - front, 2.0) * 16.0) * uPulse;
    }

    vec3 displace(vec3 p, out float band) {
        vec3 dir = normalize(p);
        float t = uTime * (0.6 + uAgitation * 2.4);
        float n = wobble(p * 1.2, t) + 0.5 * wobble(p * 2.3 + 7.0, t * 1.7);
        band = pulseBand(dir);
        return p + dir * (n * (0.06 + uAgitation * 0.16) + band * 0.32);
    }

    // 1 for geometry facing the camera, dimmer toward the back: a depth cue.
    float facing(vec3 p) {
        vec3 viewDir = normalize((modelViewMatrix * vec4(normalize(p), 0.0)).xyz);
        return 0.3 + 0.7 * smoothstep(-0.3, 1.0, viewDir.z);
    }
`;

const POINTS_VERTEX = /* glsl */ `
    ${DISPLACE_GLSL}
    uniform float uSize;
    uniform float uPixelRatio;
    attribute float aSeed;
    attribute float aScale;
    attribute float aNode;
    varying float vAlpha;

    void main() {
        float band;
        vec3 p = displace(position, band);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;

        float twinkle = 0.7 + 0.3 * sin(uTime * (1.0 + aSeed * 2.0 + uAgitation * 4.0) + aSeed * 30.0);
        float base = mix(0.5, 0.95, aNode) + uAgitation * 0.3;
        vAlpha = facing(position) * twinkle * base + band * 0.8;

        float size = uSize * aScale * mix(1.0, 2.6, aNode) * (1.0 + band * 1.5);
        gl_PointSize = size * uPixelRatio * (6.0 / max(-mv.z, 0.1));
    }
`;

const POINTS_FRAGMENT = /* glsl */ `
    uniform vec3 uColor;
    uniform float uOpacity;
    varying float vAlpha;

    void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        gl_FragColor = vec4(uColor, smoothstep(0.5, 0.05, d) * clamp(vAlpha, 0.0, 1.0) * uOpacity);
    }
`;

const LINKS_VERTEX = /* glsl */ `
    ${DISPLACE_GLSL}
    attribute float aT;
    attribute float aSeed;
    varying float vT;
    varying float vSeed;
    varying float vFacing;
    varying float vBand;

    void main() {
        float band;
        vec3 p = displace(position, band);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        vT = aT;
        vSeed = aSeed;
        vFacing = facing(position);
        vBand = band;
    }
`;

const LINKS_FRAGMENT = /* glsl */ `
    uniform vec3 uColor;
    uniform float uOpacity;
    uniform float uTime;
    uniform float uAgitation;
    varying float vT;
    varying float vSeed;
    varying float vFacing;
    varying float vBand;

    void main() {
        // A bright signal travelling along each connection; faster when thinking.
        float head = fract(uTime * (0.2 + uAgitation * 1.1) + vSeed);
        float signal = exp(-pow((vT - head) * 7.0, 2.0));
        float alpha = 0.07 + uAgitation * 0.1 + signal * (0.3 + uAgitation * 0.55) + vBand * 0.5;
        gl_FragColor = vec4(uColor, alpha * vFacing * uOpacity);
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

/** Evenly spread unit vectors on a sphere. */
function fibonacciSphere(count: number): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
        const y = 1 - (i / (count - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        const theta = golden * i;
        points.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r));
    }
    return points;
}

/**
 * A living neural network for the portfolio assistant. Dust on an outer
 * shell, neurons suspended inside it wired to their nearest neighbours, and
 * signals running along the wires. Calm when idle, stirring while the user
 * types, swirling while the assistant thinks, and sweeping a scan wave
 * through itself when an answer lands.
 */
export default function NeuralCore({ mode }: { mode: CoreMode }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [supported] = useState(hasWebGL);

    // The render loop reads these; mode changes must not rebuild the scene.
    const modeRef = useRef<CoreMode>(mode);
    const pulseRequests = useRef(0);

    useEffect(() => {
        modeRef.current = mode;
        if (mode === "answering") pulseRequests.current += 1;
    }, [mode]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !supported) return;

        const isMobile = window.matchMedia("(max-width: 767px)").matches;
        const dustCount = isMobile ? 1300 : 2600;

        // --- Geometry: shell dust + interior neurons in one buffer --------
        const total = dustCount + NODE_COUNT;
        const positions = new Float32Array(total * 3);
        const seeds = new Float32Array(total);
        const scales = new Float32Array(total);
        const isNode = new Float32Array(total);

        fibonacciSphere(dustCount).forEach((dir, i) => {
            // Slight radial jitter so the shell reads as a volume, not a surface.
            const r = RADIUS * (0.94 + Math.random() * 0.1);
            positions.set([dir.x * r, dir.y * r, dir.z * r], i * 3);
            seeds[i] = Math.random();
            scales[i] = 0.6 + Math.random() * 0.8;
        });

        const nodes: THREE.Vector3[] = [];
        for (let n = 0; n < NODE_COUNT; n++) {
            const dir = new THREE.Vector3().randomDirection();
            const node = dir.multiplyScalar(RADIUS * (0.35 + Math.random() * 0.6));
            nodes.push(node);
            const i = dustCount + n;
            positions.set([node.x, node.y, node.z], i * 3);
            seeds[i] = Math.random();
            scales[i] = 0.8 + Math.random() * 0.6;
            isNode[i] = 1;
        }

        // --- Connections: each neuron to its nearest neighbours -----------
        const pairs = new Set<string>();
        nodes.forEach((a, i) => {
            nodes
                .map((b, j) => ({ j, d: i === j ? Infinity : a.distanceToSquared(b) }))
                .sort((x, y) => x.d - y.d)
                .slice(0, NEIGHBOURS)
                .forEach(({ j }) => pairs.add(i < j ? `${i}-${j}` : `${j}-${i}`));
        });

        const linkPositions = new Float32Array(pairs.size * 6);
        const linkT = new Float32Array(pairs.size * 2);
        const linkSeeds = new Float32Array(pairs.size * 2);
        [...pairs].forEach((key, k) => {
            const [i, j] = key.split("-").map(Number);
            linkPositions.set([nodes[i].x, nodes[i].y, nodes[i].z, nodes[j].x, nodes[j].y, nodes[j].z], k * 6);
            linkT.set([0, 1], k * 2);
            const seed = Math.random();
            linkSeeds.set([seed, seed], k * 2);
        });

        const uniforms = {
            uTime: { value: 0 },
            uAgitation: { value: 0 },
            uPulse: { value: 0 },
            uPulseProgress: { value: 0 },
            uSize: { value: 2.2 },
            uPixelRatio: { value: 1 },
            uColor: { value: new THREE.Color(1, 1, 1) },
            uOpacity: { value: 1 },
        };

        const stage = createStage(canvas, {
            fov: 45,
            near: 0.1,
            far: 20,
            maxDpr: 1.75,
            onResize: () => {
                uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 1.75);
            },
            onFrame: ({ dt, elapsed, reducedMotion }) => frame(dt, elapsed, reducedMotion),
        });
        if (!stage) return;

        stage.camera.position.set(0, 0, 5.6);

        const pointsGeometry = new THREE.BufferGeometry();
        pointsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        pointsGeometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
        pointsGeometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
        pointsGeometry.setAttribute("aNode", new THREE.BufferAttribute(isNode, 1));

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

        const linksGeometry = new THREE.BufferGeometry();
        linksGeometry.setAttribute("position", new THREE.BufferAttribute(linkPositions, 3));
        linksGeometry.setAttribute("aT", new THREE.BufferAttribute(linkT, 1));
        linksGeometry.setAttribute("aSeed", new THREE.BufferAttribute(linkSeeds, 1));

        const links = new THREE.LineSegments(
            linksGeometry,
            new THREE.ShaderMaterial({
                uniforms,
                vertexShader: LINKS_VERTEX,
                fragmentShader: LINKS_FRAGMENT,
                transparent: true,
                depthWrite: false,
            }),
        );

        const core = new THREE.Group();
        core.add(links, points);
        core.rotation.x = 0.25;
        stage.scene.add(core);

        // --- Inputs -------------------------------------------------------
        const tilt = new THREE.Vector2(0, 0);
        const onPointerMove = (event: PointerEvent) => {
            const rect = canvas.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
            tilt.set(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y)));
        };
        window.addEventListener("pointermove", onPointerMove, { passive: true });

        const stopTheme = watchTheme((isDark) => {
            if (isDark) uniforms.uColor.value.setRGB(1, 1, 1);
            else uniforms.uColor.value.setRGB(0.06, 0.06, 0.06);
            uniforms.uOpacity.value = isDark ? 1 : 0.75;
        });

        // --- Frame --------------------------------------------------------
        let clock = 0;
        let spin = 0;
        let pulseStart: number | null = null;
        let pulsesSeen = pulseRequests.current;

        function frame(dt: number, elapsed: number, reducedMotion: boolean) {
            const motion = reducedMotion ? 0 : 1;

            uniforms.uAgitation.value = damp(uniforms.uAgitation.value, AGITATION[modeRef.current], 3, dt);
            const agitation = uniforms.uAgitation.value;

            // Internal clock runs faster when agitated, and stops for reduced motion.
            clock += dt * motion;
            uniforms.uTime.value = clock;

            if (pulseRequests.current !== pulsesSeen) {
                pulsesSeen = pulseRequests.current;
                pulseStart = elapsed;
            }
            if (pulseStart !== null) {
                const progress = clamp01((elapsed - pulseStart) / PULSE_SECONDS);
                uniforms.uPulseProgress.value = progress;
                uniforms.uPulse.value = Math.sin(progress * Math.PI);
                if (progress >= 1) pulseStart = null;
            } else {
                uniforms.uPulse.value = 0;
            }

            spin += dt * (0.15 + agitation * 0.95) * motion;
            core.rotation.y = spin;
            core.rotation.x = damp(core.rotation.x, 0.25 + tilt.y * 0.3 * motion, 2.5, dt);
            core.rotation.z = damp(core.rotation.z, -tilt.x * 0.18 * motion, 2.5, dt);

            // Slow breathing while calm, so the idle state still reads as alive.
            const breath = 1 + Math.sin(clock * 1.2) * 0.018 * (1 - agitation);
            core.scale.setScalar(breath);
        }

        return () => {
            window.removeEventListener("pointermove", onPointerMove);
            stopTheme();
            stage.dispose();
        };
    }, [supported]);

    if (!supported) return null;

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="absolute inset-0 w-full h-full pointer-events-none"
        />
    );
}
