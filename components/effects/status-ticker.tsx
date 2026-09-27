"use client";

import { useLanguage } from "@/providers/language-provider";

/** Pulsing dot between ticker phrases. */
const Pulse = () => (
    <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
    </span>
);

/**
 * Slim availability strip. Deliberately quieter than ManifestoFlow: small mono
 * caps rather than display type, so the two marquees read as different devices.
 */
export default function StatusTicker() {
    const { content } = useLanguage();

    const items: string[] = content?.ticker?.items ?? [];
    if (items.length === 0) return null;

    return (
        <div className="relative w-full overflow-hidden border-y border-border/50 bg-secondary/5 py-4 select-none">
            <div className="absolute left-0 top-0 bottom-0 z-10 w-16 bg-linear-to-r from-background to-transparent md:w-32" />
            <div className="absolute right-0 top-0 bottom-0 z-10 w-16 bg-linear-to-l from-background to-transparent md:w-32" />

            <div className="flex w-full overflow-hidden">
                {[0, 1].map((track) => (
                    <div
                        key={track}
                        className="animate-scroll-fast flex min-w-full shrink-0 items-center justify-around gap-10 pr-10"
                        aria-hidden={track === 1}
                    >
                        {items.map((item, index) => (
                            <div key={`${track}-${index}`} className="flex items-center gap-10">
                                <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground md:text-xs">
                                    {item}
                                </span>
                                <Pulse />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
