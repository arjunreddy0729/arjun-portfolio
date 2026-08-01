"use client";

import { createContext, useContext, useMemo } from "react";
import type { Locale } from "@/lib/i18n";
import { deepMerge, parseMarkdown } from "@/lib/markdown";

/**
 * The locale JSON tree after markdown parsing — its strings become React nodes
 * and its shape is driven by the content files, so it stays intentionally loose.
 * Every consumer that walks the tree should use this alias rather than `any`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ContentNode = any;

interface LanguageContextType {
    language: Locale;
    content: ContentNode;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
    children: React.ReactNode;
    lang: Locale;
    dictionary: Record<string, unknown>;
    contents: Record<string, unknown>;
}

export function LanguageProvider({ children, lang, dictionary, contents }: LanguageProviderProps) {
    const processedContent = useMemo(
        () => parseMarkdown(deepMerge(dictionary, contents)),
        [dictionary, contents],
    );

    return (
        <LanguageContext.Provider value={{ language: lang, content: processedContent }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
    return context;
}