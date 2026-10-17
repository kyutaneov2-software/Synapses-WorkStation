import { useCallback } from 'react'
import { useLiveData } from './useLiveData'
import type { Project } from '../../../../shared/types'

export function useProjects(): {
    projects: Project[]
    loading: boolean
    error: Error | null
    reload: () => Promise<void>
} {
    const fetcher = useCallback(() => window.api.getProjects(), [])
    const { data, loading, error, reload } = useLiveData<Project[]>(fetcher, [])
    return { projects: data, loading, error, reload }
}

export function useProject(id: number | null): {
    project: Project | null
    loading: boolean
    error: Error | null
    reload: () => Promise<void>
} {
    const fetcher = useCallback(
        () => (id === null ? Promise.resolve(null) : window.api.getProject(id)),
        [id]
    )
    const { data, loading, error, reload } = useLiveData<Project | null>(fetcher, null)
    return { project: data, loading, error, reload }
}
