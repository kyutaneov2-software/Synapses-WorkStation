import { useCallback } from 'react'
import type { DashboardData } from '../../../../shared/types'
import { useLiveData } from './useLiveData'

export function useDashboard(): {
    data: DashboardData | null
    loading: boolean
    reload: () => Promise<void>
} {
    const fetcher = useCallback(() => window.api.getDashboardData(), [])
    const { data, loading, reload } = useLiveData<DashboardData | null>(fetcher, null)
    return { data, loading, reload }
}
