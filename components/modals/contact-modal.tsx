import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

import { useLanguage } from "@/providers/language-provider";
import { ArrowUpRight, Mail, Phone } from "lucide-react";
import { useLenisModal } from "@/hooks/use-lenis-modal";

interface ContactModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ContactModal({ open, onOpenChange }: ContactModalProps) {
    const { content } = useLanguage();
    useLenisModal(open);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={true}
                className="sm:max-w-[560px] p-0 gap-0 overflow-hidden border-border/50 bg-background/95 backdrop-blur-xl"
            >
                <div className="relative px-8 pt-8 pb-6">
                    <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent" />

                    <DialogHeader className="gap-3">
                        <DialogTitle className="text-2xl font-bold tracking-tight">
                            {content.contact.modal_title}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
                            {content.contact.modal_description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col sm:flex-row flex-wrap gap-4 mt-6 sm:mt-8">
                        <a
                            href={`mailto:${content.contact.email}`}
                            className="group flex items-center gap-4 px-5 py-2.5 rounded-full border border-border/50 bg-secondary/20 backdrop-blur-sm hover:bg-foreground hover:border-foreground/30 transition-all duration-500 ease-out"
                        >
                            <div className="w-8 h-8 rounded-full border border-border/50 bg-background flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-background transition-transform duration-500">
                                <Mail className="w-3.5 h-3.5 text-foreground" />
                            </div>
                            <span className="text-foreground tracking-wide font-medium text-sm group-hover:text-background transition-colors duration-500">
                                {content.contact.email}
                            </span>
                        </a>

                        <a
                            href={`tel:${content.contact.phone.replace(/\s+/g, '')}`}
                            className="group flex items-center gap-4 px-5 py-2.5 rounded-full border border-border/50 bg-secondary/20 backdrop-blur-sm hover:bg-foreground hover:border-foreground/30 transition-all duration-500 ease-out"
                        >
                            <div className="w-8 h-8 rounded-full border border-border/50 bg-background flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-background transition-transform duration-500">
                                <Phone className="w-3.5 h-3.5 text-foreground" />
                            </div>
                            <span className="text-foreground tracking-wide font-medium text-sm group-hover:text-background transition-colors duration-500">
                                {content.contact.phone}
                            </span>
                        </a>
                    </div>

                    <div className="flex flex-wrap gap-3 items-center mt-6 sm:mt-8">
                        {content.social.items.map((link: any) => (
                            <div key={link.label}>
                                <a
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative flex h-10 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border/50 bg-background px-5 text-foreground transition-all duration-500 hover:bg-foreground hover:text-background hover:border-foreground/30"
                                >
                                    <div className="absolute inset-0 flex h-full w-full justify-center -translate-x-full -skew-x-13 group-hover:duration-1000 group-hover:translate-x-full">
                                        <div className="relative h-full w-4 bg-background/20 dark:bg-background/20" />
                                    </div>
                                    <span className="relative z-10 flex items-center gap-2 text-xs tracking-widest uppercase font-medium">
                                        {link.label}
                                        <ArrowUpRight className="w-3 h-3 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" />
                                    </span>
                                </a>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent" />
            </DialogContent>
        </Dialog>
    );
}
