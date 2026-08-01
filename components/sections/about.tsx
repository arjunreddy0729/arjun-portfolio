"use client";

import { ArrowRight } from "lucide-react";
import { BlurReveal } from "@/components/effects/blur-reveal";
import { useLanguage } from "@/providers/language-provider";
import { useState } from "react";
import { AboutModal } from "@/components/modals/about-modal";
import { HangingProfile } from "@/components/widgets/hanging-profile";
import type { EducationItem } from "@/types/project";

export default function About() {
    const { content } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <section className="w-full container-void bg-background text-foreground overflow-hidden relative">
            <div className="container mx-auto px-container">
                <div className="flex flex-col xl:flex-row gap-12 xl:gap-32">

                    <div className="xl:w-1/4">
                        <div className="flex flex-col gap-4 sticky top-32">

                            <BlurReveal>
                                <span className="title-counter">
                                    [001]
                                </span>
                            </BlurReveal>

                            <BlurReveal>
                                <h2 className="title relative z-10">
                                    {content.about.title}
                                </h2>
                            </BlurReveal>

                            <BlurReveal>
                                <div className="mt-8 hidden xl:block">
                                    <HangingProfile />
                                </div>
                            </BlurReveal>

                        </div>
                    </div>

                    <div className="xl:w-3/4 flex flex-col gap-24">

                        <div className="space-y-12">

                            <BlurReveal>
                                <h3 className="text-3xl md:text-5xl lg:text-6xl font-light leading-[1.1]">
                                    {content.about.intro}
                                </h3>
                            </BlurReveal>

                            <BlurReveal>
                                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
                                    {content.about.description}
                                </p>
                            </BlurReveal>

                            <BlurReveal>
                                <>
                                    <button
                                        onClick={() => setIsOpen(true)}
                                        className="group relative inline-flex cursor-pointer items-center gap-2 text-xl md:text-2xl font-medium py-2"
                                    >
                                        <span className="relative z-10 border-b-2 border-foreground/30 pb-1 group-hover:border-foreground transition-all duration-300">
                                            {content.about.cta}
                                        </span>
                                        <ArrowRight className="w-6 h-6" />
                                    </button>

                                    <AboutModal open={isOpen} onOpenChange={setIsOpen} />
                                </>
                            </BlurReveal>

                        </div>

                        <div className="grid md:grid-cols-2 gap-px bg-border/50 border border-border/50">
                            {content.about.education.map((item: EducationItem) => (
                                <BlurReveal key={item.school}>
                                    <div className="bg-background h-full p-8 xl:p-10 flex flex-col gap-3">
                                        <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-muted-foreground/60">
                                            {item.period} — {item.location}
                                        </span>
                                        <h4 className="text-2xl font-bold tracking-tight text-foreground leading-tight">
                                            {item.school}
                                        </h4>
                                        <p className="text-muted-foreground">{item.degree}</p>
                                        <span className="mt-2 w-fit text-xs font-mono uppercase tracking-widest text-foreground border border-border/50 rounded-full px-3 py-1">
                                            {item.grade}
                                        </span>
                                    </div>
                                </BlurReveal>
                            ))}
                        </div>

                        <div className="grid md:grid-cols-2 gap-12 xl:gap-16">
                            <BlurReveal>
                                <div className="flex flex-col gap-5">
                                    <h4 className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground">
                                        {content.about.focus_title}
                                    </h4>
                                    <ul className="flex flex-col gap-3">
                                        {content.about.focus.map((item: string) => (
                                            <li key={item} className="flex items-center gap-3 text-foreground/80">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </BlurReveal>

                            <BlurReveal>
                                <div className="flex flex-col gap-5">
                                    <h4 className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground">
                                        {content.about.coursework_title}
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {content.about.coursework.map((item: string) => (
                                            <span
                                                key={item}
                                                className="text-xs uppercase tracking-wider text-muted-foreground font-medium px-3 py-1.5 rounded-full border border-border/40 bg-secondary/10"
                                            >
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </BlurReveal>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}
