import { useCallback } from 'react'
import type { NoteSummary } from '../../../../shared/types'
import { useLiveData } from './useLiveData'

export function useNotes(): {
    notes: NoteSummary[]
    loading: boolean
    reload: () => Promise<void>
} {
    const fetcher = useCallback(() => window.api.getNotes(), [])
    const { data, loading, reload } = useLiveData<NoteSummary[]>(fetcher, [])
    return { notes: data, loading, reload }
}

export function useNotesByProject(projectId: number): {
    notes: NoteSummary[]
    loading: boolean
    reload: () => Promise<void>
} {
    const fetcher = useCallback(() => window.api.getNotesByProject(projectId), [projectId])
    const { data, loading, reload } = useLiveData<NoteSummary[]>(fetcher, [])
    return { notes: data, loading, reload }
}
