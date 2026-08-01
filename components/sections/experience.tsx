"use client";

import { BlurReveal } from "@/components/effects/blur-reveal";
import { useLanguage } from "@/providers/language-provider";
import type { ExperienceItem } from "@/types/project";

export default function Experience() {
    const { content } = useLanguage();

    return (
        <section className="w-full container-void bg-background text-foreground overflow-hidden relative border-t border-border/50">
            <div className="container mx-auto px-container">

                <div className="flex flex-col gap-4 mb-16 xl:mb-24">
                    <BlurReveal>
                        <span className="title-counter">[005]</span>
                    </BlurReveal>

                    <BlurReveal>
                        <h2 className="title">{content.experience.title}</h2>
                    </BlurReveal>

                    <BlurReveal>
                        <p className="text-lg mt-3 max-w-xl italic font-medium tracking-tight text-foreground/60">
                            {content.experience.description}
                        </p>
                    </BlurReveal>
                </div>

                <div className="flex flex-col">
                    {content.experience.items.map((item: ExperienceItem) => (
                        <BlurReveal key={item.id}>
                            <article className="group grid xl:grid-cols-[auto_1fr] gap-8 xl:gap-16 py-12 xl:py-16 border-t border-border/50 transition-all duration-700 hover:bg-secondary/5 hover:px-6">

                                <div className="flex xl:flex-col items-baseline xl:items-start gap-4 xl:gap-3 xl:w-64">
                                    <span className="text-[10px] font-mono tracking-[0.3em] text-muted-foreground/40">
                                        {item.id}
                                    </span>
                                    <div className="flex flex-col gap-2">
                                        <span className="text-sm font-mono tracking-widest uppercase text-foreground/70">
                                            {item.period}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground border border-border/40 rounded-full px-2.5 py-1">
                                                {item.type}
                                            </span>
                                            {item.current && (
                                                <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-foreground">
                                                    <span className="relative flex w-1.5 h-1.5">
                                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                                                        <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-primary" />
                                                    </span>
                                                    Current
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-6">
                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-2xl md:text-3xl xl:text-4xl font-bold tracking-tighter text-foreground leading-tight transition-colors duration-500 group-hover:text-primary">
                                            {item.role}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {item.company}
                                            <span className="mx-2 text-border">/</span>
                                            <span className="text-muted-foreground/70">{item.location}</span>
                                        </p>
                                    </div>

                                    <ul className="flex flex-col gap-4 max-w-3xl">
                                        {item.points.map((point, index) => (
                                            <li key={index} className="flex gap-4 text-foreground/75 leading-relaxed font-light">
                                                <span className="text-[10px] font-mono text-muted-foreground/50 pt-1.5 shrink-0">
                                                    {String(index + 1).padStart(2, "0")}
                                                </span>
                                                <span>{point}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="flex flex-wrap gap-2">
                                        {item.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="text-xs uppercase tracking-wider text-muted-foreground font-medium px-3 py-1 rounded-full border border-border/40 bg-background/50"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </article>
                        </BlurReveal>
                    ))}
                    <div className="border-t border-border/50" />
                </div>
            </div>
        </section>
    );
}
