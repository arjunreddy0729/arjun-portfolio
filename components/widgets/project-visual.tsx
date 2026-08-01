"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ProjectItem } from "@/types/project";

/**
 * Renders a project's screenshot when one exists, and otherwise draws a generated
 * typographic panel from the project's own metadata — so a missing asset degrades
 * into something deliberate instead of a broken image.
 */
export function ProjectVisual({
    project,
    className,
    sizes = "100vw",
    priority = false,
}: {
    project: ProjectItem;
    className?: string;
    sizes?: string;
    priority?: boolean;
}) {
    if (project.image) {
        return (
            <Image
                src={project.image}
                alt={project.title}
                fill
                sizes={sizes}
                priority={priority}
                loading={priority ? undefined : "lazy"}
                className={cn("object-cover", className)}
            />
        );
    }

    const monogram = project.title
        .split(/\s+/)
        .map((word) => word[0])
        .join("")
        .slice(0, 3)
        .toUpperCase();

    return (
        <div className={cn("absolute inset-0 overflow-hidden bg-secondary/10", className)}>
            <div
                aria-hidden
                className="absolute inset-0 opacity-[0.07]"
                style={{
                    backgroundImage:
                        "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
                    backgroundSize: "48px 48px",
                }}
            />

            <div className="absolute -right-[5%] top-1/2 -translate-y-1/2 text-[38vw] xl:text-[16vw] font-black italic tracking-tighter text-foreground/[0.06] select-none leading-none">
                {monogram}
            </div>

            <div className="absolute inset-0 bg-linear-to-tr from-primary/5 via-transparent to-primary/5" />

            <div className="absolute left-6 top-6 xl:left-12 xl:top-12 flex flex-col gap-2 max-w-[70%]">
                <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-muted-foreground/70">
                    {project.id.padStart(2, "0")} / {project.category}
                </span>
                {project.tagline && (
                    <p className="text-sm xl:text-base text-muted-foreground/80 leading-relaxed font-light">
                        {project.tagline}
                    </p>
                )}
            </div>

            {project.stack && project.stack.length > 0 && (
                <div className="absolute right-6 bottom-6 xl:right-12 xl:bottom-12 flex flex-wrap justify-end gap-2 max-w-[60%]">
                    {project.stack.slice(0, 4).map((tech) => (
                        <span
                            key={tech}
                            className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 border border-border/40 rounded-full px-3 py-1"
                        >
                            {tech}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
