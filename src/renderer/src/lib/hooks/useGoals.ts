import { useCallback } from 'react'
import { useLiveData } from './useLiveData'
import type { Goal } from '../../../../shared/types'

export function useGoals(): {
    goals: Goal[]
    loading: boolean
    error: Error | null
    reload: () => Promise<void>
} {
    const fetcher = useCallback(() => window.api.getGoals(), [])
    const { data, loading, error, reload } = useLiveData<Goal[]>(fetcher, [])
    return { goals: data, loading, error, reload }
}
