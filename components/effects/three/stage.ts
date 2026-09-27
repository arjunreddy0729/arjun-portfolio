import * as THREE from "three";

export type FrameInfo = {
    /** Seconds since the previous rendered frame, clamped so tab switches don't jump. */
    dt: number;
    /** Seconds of *rendered* time; stops advancing while the stage is paused. */
    elapsed: number;
    reducedMotion: boolean;
};

export type StageOptions = {
    fov?: number;
    near?: number;
    far?: number;
    /** Device-pixel-ratio ceiling. Point clouds gain little above 1.5 but cost a lot. */
    maxDpr?: number;
    onFrame: (frame: FrameInfo) => void;
    onResize?: (width: number, height: number) => void;
};

export type Stage = {
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    dispose: () => void;
};

/**
 * Owns the parts every Three.js effect on the site needs and none should
 * reimplement: renderer sizing, a render loop that pauses offscreen and in
 * background tabs, reduced-motion detection, and full GPU cleanup.
 *
 * Returns null when WebGL is unavailable so callers can fall back.
 */
export function createStage(canvas: HTMLCanvasElement, options: StageOptions): Stage | null {
    let renderer: THREE.WebGLRenderer;
    try {
        renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: false,
            powerPreference: "high-performance",
        });
    } catch {
        return null;
    }

    renderer.setClearColor(0x000000, 0);
    const maxDpr = options.maxDpr ?? 1.5;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(options.fov ?? 60, 1, options.near ?? 0.1, options.far ?? 100);

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = motionQuery.matches;
    const onMotionChange = (event: MediaQueryListEvent) => { reducedMotion = event.matches; };
    motionQuery.addEventListener("change", onMotionChange);

    const resize = () => {
        const parent = canvas.parentElement;
        const width = parent?.clientWidth ?? canvas.clientWidth;
        const height = parent?.clientHeight ?? canvas.clientHeight;
        if (width === 0 || height === 0) return;

        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        options.onResize?.(width, height);
    };

    const resizeObserver = new ResizeObserver(resize);
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);
    resize();

    let frameId = 0;
    let running = false;
    let last = 0;
    let elapsed = 0;

    const loop = (now: number) => {
        frameId = requestAnimationFrame(loop);
        const dt = last === 0 ? 0 : Math.min((now - last) / 1000, 1 / 20);
        last = now;
        elapsed += dt;
        options.onFrame({ dt, elapsed, reducedMotion });
        renderer.render(scene, camera);
    };

    const start = () => {
        if (running) return;
        running = true;
        last = 0;
        frameId = requestAnimationFrame(loop);
    };

    const stop = () => {
        running = false;
        cancelAnimationFrame(frameId);
    };

    // Nothing renders while the canvas is scrolled out of view.
    const visibilityObserver = new IntersectionObserver(
        ([entry]) => (entry.isIntersecting ? start() : stop()),
        { rootMargin: "100px" },
    );
    visibilityObserver.observe(canvas);

    const dispose = () => {
        stop();
        visibilityObserver.disconnect();
        resizeObserver.disconnect();
        motionQuery.removeEventListener("change", onMotionChange);

        scene.traverse((object) => {
            const mesh = object as THREE.Mesh;
            mesh.geometry?.dispose();
            const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
            if (Array.isArray(material)) material.forEach((m) => m.dispose());
            else material?.dispose();
        });
        renderer.dispose();
    };

    return { renderer, scene, camera, dispose };
}

/** Tracks the site's class-based dark mode without reading the DOM every frame. */
export function watchTheme(onChange: (isDark: boolean) => void): () => void {
    const read = () => document.documentElement.classList.contains("dark");
    onChange(read());
    const observer = new MutationObserver(() => onChange(read()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
}

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Frame-rate independent exponential smoothing toward a target. */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
    current + (target - current) * (1 - Math.exp(-lambda * dt));
