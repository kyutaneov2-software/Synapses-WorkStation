export const ROUTES = {
    // Commissions
    commissions: '/commissions',
    commissionsToday: '/commissions/today',
    commissionsTomorrow: '/commissions/tomorrow',
    commissionsAll: '/commissions/all',
    commissionsProject: (id: number): string => `/commissions/project/${id}`,

    // Other spaces
    home: '/home', // ← change from '/'
    notes: '/notes',
    schedule: '/schedule',
    goals: '/goals',
    settings: '/settings'
} as const
