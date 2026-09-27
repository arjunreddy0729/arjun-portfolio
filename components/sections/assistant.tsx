"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { BlurReveal } from "@/components/effects/blur-reveal";
import { useLanguage } from "@/providers/language-provider";
import dynamic from "next/dynamic";
import type { CoreMode } from "@/components/effects/neural-core";

// Below the fold, so Three.js loads only after hydration.
const NeuralCore = dynamic(() => import("@/components/effects/neural-core"), { ssr: false });

/** How long the core shows its answer wave before settling back to idle. */
const ANSWER_MS = 1800;

type Message = {
    role: "user" | "assistant";
    content: string;
};

export default function Assistant() {
    const { content } = useLanguage();

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [phase, setPhase] = useState<"idle" | "thinking" | "answering">("idle");
    const answerTimer = useRef<number | undefined>(undefined);

    useEffect(() => () => window.clearTimeout(answerTimer.current), []);

    // Typing into an idle assistant stirs the core before anything is sent.
    const coreMode: CoreMode = phase === "idle" && input.trim() ? "listening" : phase;

    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const node = scrollRef.current;
        if (node) node.scrollTop = node.scrollHeight;
    }, [messages, isSending]);

    const send = async (question: string) => {
        const trimmed = question.trim();
        if (!trimmed || isSending) return;

        const nextMessages: Message[] = [...messages, { role: "user", content: trimmed }];
        setMessages(nextMessages);
        setInput("");
        setIsSending(true);
        window.clearTimeout(answerTimer.current);
        setPhase("thinking");

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ messages: nextMessages }),
            });

            const data = await response.json();

            setMessages([
                ...nextMessages,
                { role: "assistant", content: data.reply ?? content.assistant.error },
            ]);
        } catch {
            setMessages([...nextMessages, { role: "assistant", content: content.assistant.error }]);
        } finally {
            setIsSending(false);
            setPhase("answering");
            answerTimer.current = window.setTimeout(() => setPhase("idle"), ANSWER_MS);
        }
    };

    return (
        <section className="w-full container-void bg-background text-foreground overflow-hidden relative border-t border-border/50">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-primary/5 blur-[140px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-container relative z-10">

                <div className="flex flex-col gap-4 mb-16">
                    <BlurReveal>
                        <span className="title-counter">[008]</span>
                    </BlurReveal>

                    <BlurReveal>
                        <h2 className="title">{content.assistant.title}</h2>
                    </BlurReveal>

                    <BlurReveal>
                        <p className="text-lg mt-3 max-w-xl italic font-medium tracking-tight text-foreground/60">
                            {content.assistant.description}
                        </p>
                    </BlurReveal>
                </div>

                <div className="max-w-6xl mx-auto grid items-center gap-8 lg:gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">

                <BlurReveal>
                    <div className="relative h-[260px] sm:h-[320px] lg:h-[520px]">
                        <NeuralCore mode={coreMode} />
                        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 whitespace-nowrap text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                            <span className={cn(
                                "w-1.5 h-1.5 rounded-full bg-primary transition-opacity duration-500",
                                coreMode === "idle" ? "opacity-40" : "opacity-100 animate-pulse",
                            )} />
                            {content.assistant.core_states?.[coreMode] ?? coreMode}
                        </span>
                    </div>
                </BlurReveal>

                <BlurReveal>
                    <div className="border border-border/50 bg-secondary/5 backdrop-blur-md">

                        <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-border/50">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full border border-border/50 bg-background flex items-center justify-center shrink-0">
                                    <Sparkles className="w-4 h-4 text-foreground/70" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold tracking-tight text-foreground uppercase">
                                        {content.assistant.panel_title}
                                    </span>
                                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                                        {content.assistant.panel_subtitle}
                                    </span>
                                </div>
                            </div>

                            <span className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground shrink-0">
                                <span className="relative flex w-1.5 h-1.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                                    <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-primary" />
                                </span>
                                {isSending ? content.assistant.thinking : content.assistant.status}
                            </span>
                        </div>

                        <div
                            ref={scrollRef}
                            data-lenis-prevent="true"
                            className="h-[380px] overflow-y-auto px-6 py-8 flex flex-col gap-6"
                        >
                            <ChatBubble role="assistant" content={content.assistant.greeting} />

                            <AnimatePresence initial={false}>
                                {messages.map((message, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                    >
                                        <ChatBubble role={message.role} content={message.content} />
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {isSending && (
                                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                                    {content.assistant.thinking}
                                    <span className="flex gap-1">
                                        {[0, 1, 2].map((dot) => (
                                            <motion.span
                                                key={dot}
                                                className="w-1 h-1 rounded-full bg-foreground/60"
                                                animate={{ opacity: [0.2, 1, 0.2] }}
                                                transition={{ duration: 1.2, repeat: Infinity, delay: dot * 0.2 }}
                                            />
                                        ))}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-border/50 px-6 py-5 flex flex-col gap-4">
                            <div className="flex flex-wrap gap-2">
                                {content.assistant.suggestions.map((suggestion: string) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => {
                                            void send(suggestion);
                                            inputRef.current?.focus();
                                        }}
                                        disabled={isSending}
                                        className="cursor-pointer text-[11px] tracking-wide text-muted-foreground border border-border/40 rounded-full px-3.5 py-1.5 transition-all duration-300 hover:text-foreground hover:border-border disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>

                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    void send(input);
                                }}
                                className="flex items-center gap-3"
                            >
                                <input
                                    ref={inputRef}
                                    value={input}
                                    onChange={(event) => setInput(event.target.value)}
                                    placeholder={content.assistant.placeholder}
                                    maxLength={600}
                                    className="flex-1 h-12 bg-background border border-border/50 px-5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors duration-300 focus:border-foreground/40"
                                />
                                <button
                                    type="submit"
                                    disabled={isSending || !input.trim()}
                                    aria-label={content.assistant.send}
                                    className="w-12 h-12 shrink-0 flex items-center justify-center bg-foreground text-background transition-all duration-300 hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    <ArrowUp className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    </div>
                </BlurReveal>

                </div>
            </div>
        </section>
    );
}

function ChatBubble({ role, content }: { role: "user" | "assistant"; content: string }) {
    const isUser = role === "user";

    return (
        <div className={cn("flex flex-col gap-2", isUser ? "items-end" : "items-start")}>
            <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-muted-foreground/50">
                {isUser ? "You" : "Assistant"}
            </span>
            <div
                className={cn(
                    "max-w-[85%] px-5 py-4 text-sm leading-relaxed whitespace-pre-line border",
                    isUser
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-foreground/85 border-border/50",
                )}
            >
                {content}
            </div>
        </div>
    );
}
