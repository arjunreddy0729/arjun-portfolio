import React from "react";

const HIGHLIGHT_MAP: Record<number, string> = {
    1: "highlight-text-tertiary",
    2: "highlight-text-secondary",
    3: "highlight-text-primary",
};

function parseInline(text: string): React.ReactNode {
    const regex = /\*{3}(.+?)\*{3}|\*{2}(.+?)\*{2}|\*(.+?)\*/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));

        const groupIndex = match[1] !== undefined ? 1 : match[2] !== undefined ? 2 : 3;
        parts.push(
            <span key={match.index} className={HIGHLIGHT_MAP[groupIndex]}>
                {match[groupIndex]}
            </span>
        );

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    if (parts.length <= 1) return parts[0] ?? text;
    return <>{parts}</>;
}

export function parseMarkdown(data: any): any {
    if (typeof data === "string") {
        if (!/\*{1,3}[^*]+\*{1,3}/.test(data) && !data.includes("\n\n")) return data;

        const paragraphs = data.split("\n\n");
        if (paragraphs.length === 1) return parseInline(data);

        return (
            <>
                {paragraphs.map((p: string, i: number) => (
                    <React.Fragment key={i}>
                        {i > 0 && <><br /><br /></>}
                        {parseInline(p)}
                    </React.Fragment>
                ))}
            </>
        );
    }

    if (Array.isArray(data)) return data.map(parseMarkdown);

    if (typeof data === "object" && data !== null) {
        const result: any = {};
        for (const key in data) result[key] = parseMarkdown(data[key]);
        return result;
    }

    return data;
}

export function deepMerge(target: any, source: any): any {
    const result = { ...target };
    for (const key of Object.keys(source)) {
        const s = source[key], t = target[key];
        result[key] =
            s && t && typeof s === "object" && typeof t === "object" && !Array.isArray(s) && !Array.isArray(t)
                ? deepMerge(t, s)
                : s;
    }
    return result;
}
