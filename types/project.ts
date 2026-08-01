export type ProjectMetric = {
    value: string;
    label: string;
};

export type ArchitectureLayer = {
    title: string;
    subtitle: string;
    items: string[];
};

export type ArchitectureDecision = {
    title: string;
    detail: string;
};

export type ProjectArchitecture = {
    flow: string[];
    layers: ArchitectureLayer[];
    decisions: ArchitectureDecision[];
};

export type ProjectItem = {
    id: string;
    title: string;
    category: string;
    year: string;
    description: string;
    tagline?: string;
    /** Optional screenshot. When absent a generated typographic panel is rendered instead. */
    image?: string;
    demo?: string;
    repo?: string;
    stack?: string[];
    highlights?: string[];
    metrics?: ProjectMetric[];
    architecture?: ProjectArchitecture;
};

export type ExperienceItem = {
    id: string;
    role: string;
    company: string;
    location: string;
    type: string;
    period: string;
    current?: boolean;
    points: string[];
    tags: string[];
};

export type CertificationItem = {
    name: string;
    issuer: string;
    topics: string[];
};

export type EducationItem = {
    school: string;
    degree: string;
    grade: string;
    location: string;
    period: string;
};

export type HeroMetric = {
    value: string;
    suffix: string;
    label: string;
};
