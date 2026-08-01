"use client";

import { Download, ShieldCheck } from "lucide-react";
import { BlurReveal } from "@/components/effects/blur-reveal";
import { useLanguage } from "@/providers/language-provider";
import type { CertificationItem } from "@/types/project";

export default function Credentials() {
    const { content } = useLanguage();

    return (
        <section className="w-full container-void bg-background text-foreground overflow-hidden relative border-t border-border/50">
            <div className="container mx-auto px-container">

                <div className="flex flex-col gap-4 mb-16">
                    <BlurReveal>
                        <span className="title-counter">[007]</span>
                    </BlurReveal>

                    <BlurReveal>
                        <h2 className="title">{content.certifications.title}</h2>
                    </BlurReveal>

                    <BlurReveal>
                        <p className="text-lg mt-3 max-w-xl italic font-medium tracking-tight text-foreground/60">
                            {content.certifications.description}
                        </p>
                    </BlurReveal>
                </div>

                <div className="grid md:grid-cols-3 gap-px bg-border/50 border border-border/50 mb-24">
                    {content.certifications.items.map((item: CertificationItem) => (
                        <BlurReveal key={item.name}>
                            <div className="group bg-background h-full p-8 xl:p-10 flex flex-col gap-5 transition-colors duration-500 hover:bg-secondary/10">
                                <div className="w-12 h-12 rounded-full border border-border/50 flex items-center justify-center bg-secondary/20 transition-all duration-500 group-hover:border-primary/50">
                                    <ShieldCheck className="w-5 h-5 text-foreground/70" />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <h3 className="text-xl font-bold tracking-tight text-foreground leading-snug">
                                        {item.name}
                                    </h3>
                                    <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                                        {item.issuer}
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-2 mt-auto pt-4">
                                    {item.topics.map((topic) => (
                                        <span
                                            key={topic}
                                            className="text-[10px] uppercase tracking-widest text-muted-foreground px-2.5 py-1 rounded-full border border-border/40"
                                        >
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </BlurReveal>
                    ))}
                </div>

                <BlurReveal>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 p-8 xl:p-12 border border-border/50 bg-secondary/5 backdrop-blur-md">
                        <div className="flex flex-col gap-4 max-w-xl">
                            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-muted-foreground/60">
                                {content.resume.title}
                            </span>
                            <h3 className="text-3xl xl:text-4xl font-bold tracking-tighter text-foreground">
                                {content.resume.role_line}
                            </h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {content.resume.description}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {content.resume.highlights.map((item: string) => (
                                    <span
                                        key={item}
                                        className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground px-2.5 py-1 rounded-full border border-border/40"
                                    >
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">
                            <a
                                href={content.resume.file}
                                download={content.resume.filename}
                                className="group relative flex h-14 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border/50 bg-foreground px-8 text-background transition-all duration-500 ease-out hover:bg-background hover:border-foreground/30 hover:text-foreground shadow-2xl hover:-translate-y-0.5"
                            >
                                <div className="absolute inset-0 flex h-full w-full justify-center -translate-x-full -skew-x-12 group-hover:duration-1000 group-hover:translate-x-full">
                                    <div className="relative h-full w-8 bg-background/20 dark:bg-foreground/10" />
                                </div>
                                <span className="relative z-10 flex items-center gap-3 text-xs font-semibold tracking-[0.15em] uppercase">
                                    {content.resume.cta}
                                    <Download className="w-4 h-4 transition-transform duration-500 group-hover:translate-y-0.5" />
                                </span>
                            </a>
                            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
                                {content.resume.meta}
                            </span>
                        </div>
                    </div>
                </BlurReveal>
            </div>
        </section>
    );
}
