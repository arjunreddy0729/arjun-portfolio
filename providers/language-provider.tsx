"use client";

import { createContext, useContext, useMemo } from "react";
import type { Locale } from "@/lib/i18n";
import { deepMerge, parseMarkdown } from "@/lib/markdown";

interface LanguageContextType {
    language: Locale;
    content: any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
    children: React.ReactNode;
    lang: Locale;
    dictionary: Record<string, any>;
    contents: Record<string, any>;
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