export const ROUTES = {
    // Tasks
    tasks: '/tasks',
    tasksToday: '/tasks/today',
    tasksTomorrow: '/tasks/tomorrow',
    tasksAll: '/tasks/all',

    // Projects
    projects: '/projects',
    projectDetail: (id: number): string => `/projects/${id}`,

    // Other spaces
    home: '/home',
    notes: '/notes',
    schedule: '/schedule',
    goals: '/goals',
    settings: '/settings'
} as const
