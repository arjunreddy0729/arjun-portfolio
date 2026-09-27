"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { BlurReveal } from "@/components/effects/blur-reveal";
import { useLanguage } from "@/providers/language-provider";
import type { HeroMetric } from "@/types/project";

export default function Metrics() {
    const { content } = useLanguage();

    return (
        <section className="w-full bg-background border-b border-border/50">
            <div className="container mx-auto px-container">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border/50">
                    {content.hero.metrics.map((metric: HeroMetric) => (
                        <BlurReveal key={metric.label}>
                            <div className="bg-background h-full py-10 xl:py-14 px-6 flex flex-col gap-2">
                                <span className="text-4xl xl:text-6xl font-black tracking-tighter text-foreground leading-none">
                                    <Counter value={metric.value} />
                                    <span className="text-muted-foreground/60">{metric.suffix}</span>
                                </span>
                                <span className="text-[10px] xl:text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
                                    {metric.label}
                                </span>
                            </div>
                        </BlurReveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

/** Counts up to a numeric value once the tile scrolls into view. */
function Counter({ value }: { value: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-80px" });

    const target = Number(value);
    const decimals = value.includes(".") ? value.split(".")[1].length : 0;

    const [display, setDisplay] = useState(Number.isFinite(target) ? "0" : value);

    useEffect(() => {
        if (!isInView || !Number.isFinite(target)) return;

        const duration = 1200;
        let frame = 0;
        let start: number | null = null;

        const step = (timestamp: number) => {
            if (start === null) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay((target * eased).toFixed(decimals));
            if (progress < 1) frame = requestAnimationFrame(step);
        };

        frame = requestAnimationFrame(step);
        return () => cancelAnimationFrame(frame);
    }, [isInView, target, decimals]);

    return <span ref={ref}>{display}</span>;
}
