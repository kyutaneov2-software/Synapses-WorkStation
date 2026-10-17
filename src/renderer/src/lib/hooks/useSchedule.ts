import { useCallback } from 'react'
import { useLiveData } from './useLiveData'
import type { ScheduleBlockWithTask } from '../../../../shared/types'

export function useScheduleRange(
    fromDate: string,
    toDate: string
): {
    blocks: ScheduleBlockWithTask[]
    loading: boolean
    error: Error | null
    reload: () => Promise<void>
} {
    const fetcher = useCallback(
        () => window.api.getScheduleRange(fromDate, toDate),
        [fromDate, toDate]
    )
    const { data, loading, error, reload } = useLiveData<ScheduleBlockWithTask[]>(fetcher, [])
    return { blocks: data, loading, error, reload }
}
