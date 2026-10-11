export const CURRENCIES = ['USD', 'PHP', 'EUR', 'GBP'] as const
export type CurrencyCode = (typeof CURRENCIES)[number]

export const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$',
    PHP: '₱',
    EUR: '€',
    GBP: '£'
}

export const CURRENCY_NAMES: Record<CurrencyCode, string> = {
    USD: 'US Dollar',
    PHP: 'Philippine Peso',
    EUR: 'Euro',
    GBP: 'British Pound'
}

export const PROJECT_STATUSES = ['active', 'paused', 'completed', 'archived'] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export const IPC_CHANNELS = {
    DATA_CHANGED: 'data:changed'
} as const

export const PRIORITY_LEVELS = ['none', 'low', 'medium', 'high'] as const
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number]

export const PRIORITY_VALUES: Record<PriorityLevel, number> = {
    none: 0,
    low: 1,
    medium: 2,
    high: 3
}

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
    none: 'No priority',
    low: 'Low priority',
    medium: 'Medium priority',
    high: 'High priority'
}

export function priorityLevel(value: number): PriorityLevel {
    if (value >= 3) return 'high'
    if (value === 2) return 'medium'
    if (value === 1) return 'low'
    return 'none'
}

export const PROJECT_TYPES = [
    'mobile_app',
    'website',
    'desktop_app',
    'video',
    'illustration',
    'writing',
    'other'
] as const
export type ProjectType = (typeof PROJECT_TYPES)[number]

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
    mobile_app: 'Mobile App',
    website: 'Website',
    desktop_app: 'Desktop App',
    video: 'Video',
    illustration: 'Illustration',
    writing: 'Writing',
    other: 'Other'
}

export const TECH_STACK_PRESETS = [
    'TypeScript',
    'JavaScript',
    'React',
    'Next.js',
    'Vue',
    'Svelte',
    'Node.js',
    'Express',
    'Python',
    'Django',
    'Flask',
    'Swift',
    'Kotlin',
    'Flutter',
    'React Native',
    'Electron',
    'Tailwind CSS',
    'PostgreSQL',
    'SQLite',
    'MongoDB'
] as const

export const TAG_COLORS = [
    '#6c8cff', // blue
    '#a78bfa', // purple
    '#f472b6', // pink
    '#fb923c', // orange
    '#facc15', // yellow
    '#4ade80', // green
    '#22d3ee', // cyan
    '#94a3b8' // slate
] as const
