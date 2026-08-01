import { useCallback, useSyncExternalStore } from "react";

export const BREAKPOINTS = {
    sm: "(min-width: 640px)",
    md: "(min-width: 768px)",
    lg: "(min-width: 1024px)",
    xl: "(min-width: 1280px)",
    "2xl": "(min-width: 1536px)",
} as const;

/**
 * One MediaQueryList per query, kept alive for the lifetime of the page.
 * Creating a fresh list inside subscribe lets the browser collect it, which
 * silently kills the change listener and freezes the hook at its first value.
 */
const lists = new Map<string, MediaQueryList>();

function getList(query: string): MediaQueryList {
    let list = lists.get(query);
    if (!list) {
        list = window.matchMedia(query);
        lists.set(query, list);
    }
    return list;
}

export function useMediaQuery(query: string): boolean {
    const subscribe = useCallback(
        (onStoreChange: () => void) => {
            const list = getList(query);
            list.addEventListener("change", onStoreChange);
            return () => list.removeEventListener("change", onStoreChange);
        },
        [query],
    );

    const getSnapshot = useCallback(() => getList(query).matches, [query]);

    // Server and first client render agree on false, then the store syncs.
    const getServerSnapshot = useCallback(() => false, []);

    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
