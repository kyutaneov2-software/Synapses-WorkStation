import { useCallback } from 'react'
import type { Tag } from '../../../../shared/types'
import { useLiveData } from './useLiveData'

export function useProjectTags(projectId: number): {
    tags: Tag[]
    loading: boolean
    reload: () => Promise<void>
} {
    const fetcher = useCallback(() => window.api.getProjectTags(projectId), [projectId])
    const { data, loading, reload } = useLiveData<Tag[]>(fetcher, [])
    return { tags: data, loading, reload }
}
