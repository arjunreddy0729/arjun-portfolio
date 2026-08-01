import { NextResponse } from 'next/server';
import { SYSTEM_PROMPT, answerLocally } from '@/lib/portfolio-knowledge';

export const runtime = 'nodejs';

const MODEL = 'claude-sonnet-5';
const MAX_QUESTION_LENGTH = 600;
const MAX_HISTORY = 8;

type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

function sanitize(messages: unknown): ChatMessage[] {
    if (!Array.isArray(messages)) return [];

    return messages
        .filter(
            (message): message is ChatMessage =>
                typeof message === 'object' &&
                message !== null &&
                (message as ChatMessage).role !== undefined &&
                typeof (message as ChatMessage).content === 'string',
        )
        .filter((message) => message.role === 'user' || message.role === 'assistant')
        .slice(-MAX_HISTORY)
        .map((message) => ({
            role: message.role,
            content: message.content.slice(0, MAX_QUESTION_LENGTH),
        }));
}

export async function POST(request: Request) {
    let messages: ChatMessage[];

    try {
        const body = await request.json();
        messages = sanitize(body?.messages);
    } catch {
        return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const question = [...messages].reverse().find((message) => message.role === 'user')?.content.trim();

    if (!question) {
        return NextResponse.json({ error: 'No question provided.' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    // No key configured — serve the scripted answers so the assistant still works.
    if (!apiKey) {
        return NextResponse.json({ reply: answerLocally(question), source: 'local' });
    }

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: MODEL,
                max_tokens: 500,
                system: SYSTEM_PROMPT,
                messages,
            }),
        });

        if (!response.ok) {
            return NextResponse.json({ reply: answerLocally(question), source: 'local' });
        }

        const data = await response.json();
        const reply = (data?.content ?? [])
            .filter((block: { type: string }) => block.type === 'text')
            .map((block: { text: string }) => block.text)
            .join('\n')
            .trim();

        if (!reply) {
            return NextResponse.json({ reply: answerLocally(question), source: 'local' });
        }

        return NextResponse.json({ reply, source: 'ai' });
    } catch {
        return NextResponse.json({ reply: answerLocally(question), source: 'local' });
    }
}
