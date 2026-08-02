import 'server-only';
import content from '@/contents/en.json';
import type { CertificationItem, EducationItem, ExperienceItem, ProjectItem } from '@/types/project';

/** Strips the inline markdown emphasis markers used by the content files. */
const plain = (value: string) => value.replace(/\*+/g, '');

const projects = content.projects.items as ProjectItem[];
const experience = content.experience.items as ExperienceItem[];
const education = content.about.education as EducationItem[];
const certifications = content.certifications.items as CertificationItem[];

/**
 * The full portfolio, flattened into prose. Used as the system context for the
 * Claude-backed assistant so it can only answer from real portfolio data.
 */
export function buildKnowledgeBase(): string {
    const sections: string[] = [];

    sections.push(
        `IDENTITY\nName: Kadari Arjun Reddy. Location: ${content.contact.location}. Email: ${content.contact.email}. Phone: ${content.contact.phone}.\nGitHub: ${content.social.items[0].href}. LinkedIn: ${content.social.items[1].href}.`,
    );

    sections.push(`ABOUT\n${content.about.full}`);

    sections.push(
        `EDUCATION\n${education
            .map((item) => `- ${item.school} — ${item.degree} (${item.grade}), ${item.location}, ${item.period}`)
            .join('\n')}`,
    );

    sections.push(
        `EXPERIENCE\n${experience
            .map(
                (item) =>
                    `- ${item.role} at ${item.company} (${item.location}), ${item.period}${item.current ? ' [CURRENT ROLE]' : ''}\n${item.points
                        .map((point) => `    * ${point}`)
                        .join('\n')}\n    Technologies: ${item.tags.join(', ')}`,
            )
            .join('\n')}`,
    );

    sections.push(
        `PROJECTS\n${projects
            .map((item) => {
                const parts = [
                    `- ${item.title} (${item.category}, ${item.year})`,
                    `    ${item.description}`,
                    `    Stack: ${(item.stack ?? []).join(', ')}`,
                ];
                if (item.highlights?.length) {
                    parts.push(item.highlights.map((point) => `    * ${point}`).join('\n'));
                }
                if (item.architecture) {
                    parts.push(`    Pipeline: ${item.architecture.flow.join(' -> ')}`);
                    parts.push(
                        item.architecture.layers
                            .map((layer) => `    Layer ${layer.title} (${layer.subtitle}): ${layer.items.join(', ')}`)
                            .join('\n'),
                    );
                    parts.push(
                        item.architecture.decisions
                            .map((decision) => `    Decision — ${decision.title}: ${decision.detail}`)
                            .join('\n'),
                    );
                }
                if (item.repo) parts.push(`    Repository: ${item.repo}`);
                if (item.demo) parts.push(`    Live demo: ${item.demo}`);
                return parts.join('\n');
            })
            .join('\n')}`,
    );

    sections.push(
        `SKILLS\n${content.stack.items
            .map((category) => `- ${category.title}: ${category.items.map((entry) => entry.name).join(', ')}`)
            .join('\n')}`,
    );

    sections.push(
        `CERTIFICATIONS\n${certifications
            .map((item) => `- ${item.name} (${item.issuer}) — ${item.topics.join(', ')}`)
            .join('\n')}`,
    );

    sections.push(
        `TIMELINE\n${content.roadmap.items.map((item) => `- ${item.year}: ${item.description}`).join('\n')}`,
    );

    sections.push(
        `CURRENTLY EXPLORING\n${content.about.focus.join(', ')}\n\nCOURSEWORK\n${content.about.coursework.join(', ')}`,
    );

    return sections.map(plain).join('\n\n');
}

export const SYSTEM_PROMPT = `You are the portfolio assistant for Kadari Arjun Reddy, embedded on his personal portfolio site. Visitors are usually recruiters, hiring managers, or fellow engineers.

Rules:
- Answer ONLY from the portfolio data below. If something is not in the data, say you don't have that detail and point the visitor to his email (${content.contact.email}).
- Refer to him as "Arjun". Write in third person.
- Be concise: two to four sentences, or a short bullet list for multi-part answers. No preamble, no sign-off.
- Never invent metrics, employers, dates, or technologies.
- Plain text only — no markdown headers or bold.

PORTFOLIO DATA
${buildKnowledgeBase()}`;

type Intent = {
    keywords: string[];
    answer: () => string;
};

const currentRole = experience.find((item) => item.current) ?? experience[0];
const projectByName = (name: string) => projects.find((item) => item.title.toLowerCase().includes(name))!;

const INTENTS: Intent[] = [
    {
        keywords: ['now', 'currently', 'current', 'today', 'these days', 'right now', 'joola', 'sport squad'],
        answer: () =>
            `Arjun is currently a ${currentRole.role} at ${currentRole.company} (${currentRole.period}). ${currentRole.points[0]} He also builds AI chatbots, recommendation systems, and workflow automation into Shopify applications.`,
    },
    {
        keywords: ['study buddy', 'study', 'flashcard', 'quiz', 'pdf', 'gpt-4o', 'streamlit'],
        answer: () => {
            const project = projectByName('study buddy');
            return `${project.title} (${project.year}) — ${project.description} Built with ${(project.stack ?? []).join(', ')}. Pipeline: ${project.architecture!.flow.join(' → ')}.`;
        },
    },
    {
        keywords: ['emoji', 'cnn', 'classifier', 'opencv', 'image', 'accuracy', 'augmentation'],
        answer: () => {
            const project = projectByName('emoji');
            return `${project.title} (${project.year}) — ${project.description} ${project.highlights![1]} Pipeline: ${project.architecture!.flow.join(' → ')}.`;
        },
    },
    {
        keywords: ['convlstm', 'video', 'temporal', 'spatiotemporal', 'flask'],
        answer: () => {
            const project = projectByName('convlstm');
            return `${project.title} (${project.year}) — ${project.description} ${project.architecture!.decisions[0].detail}`;
        },
    },
    {
        keywords: ['project', 'projects', 'built', 'build', 'portfolio work', 'work on'],
        answer: () =>
            `Arjun has three featured projects:\n${projects
                .map((item) => `• ${item.title} (${item.category}, ${item.year}) — ${item.tagline ?? item.description}`)
                .join('\n')}`,
    },
    {
        keywords: ['stack', 'tech', 'technolog', 'skill', 'language', 'tools', 'framework', 'know'],
        answer: () =>
            `Arjun's stack:\n${content.stack.items
                .map((category) => `• ${category.title}: ${category.items.map((entry) => entry.name).join(', ')}`)
                .join('\n')}`,
    },
    {
        keywords: ['experience', 'worked', 'job', 'intern', 'tcs', 'tata', 'teaching', 'assistant', 'career'],
        answer: () =>
            `Arjun's experience:\n${experience
                .map((item) => `• ${item.role} — ${item.company} (${item.period})`)
                .join('\n')}\nAt TCS he shipped 5 Power BI dashboards and cut KPI reporting time by 50%; as a CS 555 TA he supported 40+ students on Scrum and Kanban.`,
    },
    {
        keywords: ['education', 'school', 'university', 'degree', 'gpa', 'college', 'stevens', 'cvr', 'study at', 'graduat'],
        answer: () =>
            `Education:\n${education
                .map((item) => `• ${item.school} — ${item.degree}, ${item.grade} (${item.period})`)
                .join('\n')}`,
    },
    {
        keywords: ['certification', 'certificate', 'certified', 'course', 'aws academy', 'google cyber'],
        answer: () =>
            `Certifications:\n${certifications.map((item) => `• ${item.name} — ${item.issuer}`).join('\n')}`,
    },
    {
        keywords: ['resume', 'cv', 'download'],
        answer: () =>
            `Arjun's full resume is downloadable from the Certifications section of this site (${content.resume.filename}). It covers his education, experience, projects, skills, and certifications.`,
    },
    {
        keywords: ['hire', 'hiring', 'available', 'availability', 'contact', 'reach', 'email', 'opportunit', 'looking for', 'open to'],
        answer: () =>
            `Yes — Arjun is open to AI/ML, data, and software engineering roles. He's based in ${content.contact.location}. Reach him at ${content.contact.email} or ${content.contact.phone}.`,
    },
    {
        keywords: ['who', 'about', 'yourself', 'himself', 'background', 'introduce'],
        answer: () =>
            `Arjun is a Computer Science master's student at Stevens Institute of Technology (GPA 3.91) currently interning at Sport Squad, Inc. (JOOLA) building generative and agentic AI features. He works across AI/ML, full-stack development, and data analytics.`,
    },
    {
        keywords: ['architecture', 'design', 'pipeline', 'system'],
        answer: () =>
            `Architecture breakdowns for each project are in the Architecture section. In short:\n${projects
                .filter((item) => item.architecture)
                .map((item) => `• ${item.title}: ${item.architecture!.flow.join(' → ')}`)
                .join('\n')}`,
    },
];

const FALLBACK = `I can answer questions about Arjun's projects, tech stack, experience, education, certifications, or availability. For anything else, email him at ${content.contact.email}.`;

/**
 * Keyword-scored answers used when no ANTHROPIC_API_KEY is configured, or when
 * the API call fails — so the assistant is never a dead input box.
 */
export function answerLocally(question: string): string {
    const query = question.toLowerCase();

    let best: { score: number; intent: Intent | null } = { score: 0, intent: null };

    for (const intent of INTENTS) {
        const score = intent.keywords.reduce(
            (total, keyword) => (query.includes(keyword) ? total + keyword.length : total),
            0,
        );
        if (score > best.score) best = { score, intent };
    }

    return best.intent ? best.intent.answer() : FALLBACK;
}
