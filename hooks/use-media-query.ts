import { useState, useEffect } from "react";

export const BREAKPOINTS = {
    sm: "(min-width: 640px)",
    md: "(min-width: 768px)",
    lg: "(min-width: 1024px)",
    xl: "(min-width: 1280px)",
    "2xl": "(min-width: 1536px)",
} as const;

export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const media = window.matchMedia(query);

        if (media.matches !== matches) {
            setMatches(media.matches);
        }

        const listener = () => setMatches(media.matches);

        if (media.addEventListener) {
            media.addEventListener("change", listener);
        } else {
            media.addListener(listener);
        }

        return () => {
            if (media.removeEventListener) {
                media.removeEventListener("change", listener);
            } else {
                media.removeListener(listener);
            }
        };
    }, [query]);

    return matches;
}