"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BlurReveal } from "@/components/effects/blur-reveal";
import { useLanguage } from "@/providers/language-provider";
import type { ProjectItem } from "@/types/project";

export default function Architecture() {
    const { content } = useLanguage();

    const projects: ProjectItem[] = content.projects.items.filter(
        (project: ProjectItem) => project.architecture,
    );

    const [activeId, setActiveId] = useState<string>(projects[0]?.id ?? "");
    const active = projects.find((project) => project.id === activeId) ?? projects[0];

    if (!active?.architecture) return null;

    return (
        <section className="w-full container-void bg-background text-foreground overflow-hidden relative border-t border-border/50">
            <div className="container mx-auto px-container">

                <div className="flex flex-col gap-4 mb-16">
                    <BlurReveal>
                        <span className="title-counter">[004]</span>
                    </BlurReveal>

                    <BlurReveal>
                        <h2 className="title">{content.architecture.title}</h2>
                    </BlurReveal>

                    <BlurReveal>
                        <p className="text-lg mt-3 max-w-xl italic font-medium tracking-tight text-foreground/60">
                            {content.architecture.description}
                        </p>
                    </BlurReveal>
                </div>

                <BlurReveal>
                    <div className="flex flex-wrap gap-2 mb-12">
                        {projects.map((project, index) => (
                            <button
                                key={project.id}
                                onClick={() => setActiveId(project.id)}
                                className={cn(
                                    "cursor-pointer text-xs font-mono uppercase tracking-widest px-5 py-3 border transition-all duration-500",
                                    project.id === active.id
                                        ? "border-foreground bg-foreground text-background"
                                        : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border",
                                )}
                            >
                                <span className="opacity-50 mr-2">0{index + 1}</span>
                                {project.title}
                            </button>
                        ))}
                    </div>
                </BlurReveal>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={active.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="flex flex-col gap-12"
                    >
                        <div className="flex flex-col gap-4">
                            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-muted-foreground/60">
                                {content.architecture.flow_label}
                            </span>
                            <div className="flex flex-wrap items-center gap-2 p-6 border border-border/50 bg-secondary/10">
                                {active.architecture!.flow.map((step, index) => (
                                    <span key={step} className="flex items-center gap-2">
                                        <span className="text-xs font-mono uppercase tracking-wider text-foreground/80 border border-border/40 rounded-full px-4 py-2 bg-background">
                                            {step}
                                        </span>
                                        {index < active.architecture!.flow.length - 1 && (
                                            <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                                        )}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-px bg-border/50 border border-border/50">
                            {active.architecture!.layers.map((layer, index) => (
                                <div
                                    key={layer.title}
                                    className="group bg-background p-6 xl:p-8 flex flex-col gap-4 transition-colors duration-500 hover:bg-secondary/10"
                                >
                                    <span className="text-[10px] font-mono tracking-[0.3em] text-muted-foreground/40">
                                        0{index + 1}
                                    </span>
                                    <div className="flex flex-col gap-1">
                                        <h3 className="text-lg font-bold tracking-tight uppercase text-foreground">
                                            {layer.title}
                                        </h3>
                                        <span className="text-xs font-mono text-primary/70 tracking-wide">
                                            {layer.subtitle}
                                        </span>
                                    </div>
                                    <ul className="flex flex-col gap-2 mt-2">
                                        {layer.items.map((item) => (
                                            <li
                                                key={item}
                                                className="text-sm text-muted-foreground flex items-start gap-2"
                                            >
                                                <span className="w-1 h-1 rounded-full bg-border mt-2 shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col gap-6">
                            <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground">
                                {content.architecture.decisions_title}
                            </h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                {active.architecture!.decisions.map((decision) => (
                                    <div
                                        key={decision.title}
                                        className="p-8 border border-border/50 bg-secondary/5 backdrop-blur-md transition-all duration-500 hover:border-border hover:bg-secondary/15"
                                    >
                                        <h4 className="text-xl font-semibold tracking-tight text-foreground mb-3">
                                            {decision.title}
                                        </h4>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {decision.detail}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </section>
    );
}
