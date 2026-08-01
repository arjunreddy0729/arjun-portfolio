import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

import { useLenisModal } from "@/hooks/use-lenis-modal";
import { useLanguage } from "@/providers/language-provider";
import { Github, ExternalLink, ChevronRight } from "lucide-react";
import { ProjectVisual } from "@/components/widgets/project-visual";
import type { ProjectItem } from "@/types/project";

interface ProjectModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: ProjectItem | null;
}

export function ProjectModal({ open, onOpenChange, project }: ProjectModalProps) {
    useLenisModal(open);
    const { content } = useLanguage();

    if (!project) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={true}
                className="flex flex-col sm:max-w-[800px] w-[95vw] max-h-[90vh] p-0 gap-0 border-border/50 bg-background/95 backdrop-blur-xl shrink-0"
            >
                <DialogHeader className="sr-only">
                    <DialogTitle>{project.title}</DialogTitle>
                    <DialogDescription>{content?.others?.project_details || "Details about"} {project.title}</DialogDescription>
                </DialogHeader>

                <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent z-10" />

                <div className="overflow-y-auto w-full h-full flex-1" data-lenis-prevent="true">

                    <div className="relative w-full h-[40vh] sm:h-[50vh] shrink-0">
                        <ProjectVisual project={project} sizes="800px" priority className="rounded-lg" />
                        <div className="absolute inset-0 bg-linear-to-t from-background to-transparent" />

                        <div className="absolute bottom-6 left-6 right-6 sm:bottom-10 sm:left-10 sm:right-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                            <div>
                                <h2 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tighter text-foreground mb-2">
                                    {project.title}
                                </h2>
                                <div className="flex items-center gap-3 text-sm font-mono tracking-widest text-muted-foreground uppercase">
                                    <span>{project.category}</span>
                                    <span className="w-1 h-1 rounded-full bg-border" />
                                    <span>{project.year}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 sm:p-10 flex flex-col gap-10">
                        <div>
                            <h3 className="text-sm tracking-widest text-muted-foreground uppercase mb-4">{content?.others?.about_project || "About the Project"}</h3>
                            <p className="text-lg text-foreground/80 leading-relaxed font-light">
                                {project.description}
                            </p>
                        </div>

                        {project.metrics && project.metrics.length > 0 && (
                            <div>
                                <h3 className="text-sm tracking-widest text-muted-foreground uppercase mb-4">{content?.others?.impact || "Impact"}</h3>
                                <div className="grid grid-cols-3 gap-px bg-border/50 border border-border/50">
                                    {project.metrics.map((metric) => (
                                        <div key={metric.label} className="bg-background p-4 sm:p-6 flex flex-col gap-1">
                                            <span className="text-2xl sm:text-3xl font-black tracking-tighter text-foreground">
                                                {metric.value}
                                            </span>
                                            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                                                {metric.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {project.highlights && project.highlights.length > 0 && (
                            <div>
                                <h3 className="text-sm tracking-widest text-muted-foreground uppercase mb-4">{content?.others?.highlights || "What It Does"}</h3>
                                <ul className="flex flex-col gap-4">
                                    {project.highlights.map((point, index) => (
                                        <li key={index} className="flex gap-4 text-foreground/80 leading-relaxed font-light">
                                            <span className="text-[10px] font-mono text-muted-foreground/60 pt-1.5 shrink-0">
                                                {String(index + 1).padStart(2, "0")}
                                            </span>
                                            <span>{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {project.architecture && (
                            <div>
                                <h3 className="text-sm tracking-widest text-muted-foreground uppercase mb-4">Architecture</h3>
                                <div className="flex flex-wrap items-center gap-2 p-4 sm:p-6 border border-border/50 bg-secondary/10">
                                    {project.architecture.flow.map((step, index) => (
                                        <span key={step} className="flex items-center gap-2">
                                            <span className="text-xs font-mono uppercase tracking-wider text-foreground/70 border border-border/40 rounded-full px-3 py-1.5 bg-background">
                                                {step}
                                            </span>
                                            {index < project.architecture!.flow.length - 1 && (
                                                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                                            )}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {project.stack && project.stack.length > 0 && (
                            <div>
                                <h3 className="text-sm tracking-widest text-muted-foreground uppercase mb-4">{content?.others?.technologies || "Technologies"}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {project.stack.map((tech) => (
                                        <span
                                            key={tech}
                                            className="px-4 py-1.5 rounded-full border border-border/50 bg-secondary/50 text-sm"
                                        >
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(project.demo || project.repo) && (
                            <div className="flex flex-wrap gap-4 pt-4 border-t border-border/50">
                                {project.demo && (
                                    <a
                                        href={project.demo}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group relative flex h-12 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border/50 bg-foreground px-6 sm:px-8 text-background transition-all duration-500 ease-out hover:bg-background hover:border-foreground/30 hover:text-foreground shadow-lg hover:-translate-y-1"
                                    >
                                        <div className="absolute inset-0 flex h-full w-full justify-center -translate-x-full -skew-x-13 group-hover:duration-1000 group-hover:translate-x-full">
                                            <div className="relative h-full w-8 bg-background/20 dark:bg-foreground/10" />
                                        </div>
                                        <span className="relative z-10 flex items-center gap-2 text-xs sm:text-sm font-medium tracking-widest uppercase">
                                            {content?.others?.live_demo || "Live Demo"}
                                            <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" />
                                        </span>
                                    </a>
                                )}

                                {project.repo && (
                                    <a
                                        href={project.repo}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group relative flex h-12 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border/50 bg-secondary/10 backdrop-blur-md px-6 sm:px-8 text-foreground transition-all duration-500 ease-out hover:bg-foreground hover:border-foreground/30 hover:text-background shadow-sm hover:-translate-y-1"
                                    >
                                        <div className="absolute inset-0 flex h-full w-full justify-center -translate-x-full -skew-x-13 group-hover:duration-1000 group-hover:translate-x-full">
                                            <div className="relative h-full w-8 bg-foreground/10 dark:bg-background/20" />
                                        </div>
                                        <span className="relative z-10 flex items-center gap-2 text-xs sm:text-sm font-medium tracking-widest uppercase">
                                            {content?.others?.source_code || "Source Code"}
                                            <Github className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
                                        </span>
                                    </a>
                                )}
                            </div>
                        )}

                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent z-10" />
            </DialogContent>
        </Dialog>
    );
}
