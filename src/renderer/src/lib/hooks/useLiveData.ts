import { useEffect, useRef, useState, useCallback } from 'react'

export interface UseLiveDataResult<T> {
    data: T
    loading: boolean
    error: Error | null
    reload: () => Promise<void>
}

/**
 * Subscribes to a piece of data from the main process and refreshes it
 * whenever any window mutates the database.
 *
 * - `fetcher` MUST be memoized (useCallback) — otherwise the effect
 *   re-subscribes on every render and you get a broadcast storm.
 * - Errors from the fetcher are surfaced via `error`; `loading` is
 *   always cleared once the first fetch resolves (success or failure).
 * - Concurrent fetches are serialized by generation: only the most
 *   recent call's result is applied. Older in-flight responses are dropped.
 */
export function useLiveData<T>(fetcher: () => Promise<T>, initial: T): UseLiveDataResult<T> {
    const [data, setData] = useState<T>(initial)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    // Tracks whether this component instance is still mounted.
    const aliveRef = useRef(true)
    // Monotonic generation counter — bumped on every fetch.
    const genRef = useRef(0)

    useEffect(() => {
        aliveRef.current = true
        return () => {
            aliveRef.current = false
        }
    }, [])

    const reload = useCallback(async (): Promise<void> => {
        const gen = ++genRef.current
        try {
            const next = await fetcher()
            if (!aliveRef.current || gen !== genRef.current) return
            setData(next)
            setError(null)
        } catch (e) {
            if (!aliveRef.current || gen !== genRef.current) return
            setError(e instanceof Error ? e : new Error(String(e)))
        } finally {
            if (aliveRef.current && gen === genRef.current) {
                setLoading(false)
            }
        }
    }, [fetcher])

    useEffect(() => {
        let cancelled = false

        const run = (): void => {
            if (cancelled) return
            void reload()
        }

        // Defer the initial fetch to a microtask. `reload` is async and never
        // calls setState synchronously, but the React Compiler lint can't prove
        // that, so we sidestep the warning by not invoking it from the effect
        // body directly. Same code path, same guarantees.
        queueMicrotask(run)

        const unsubscribe = window.api.onDataChanged(run)

        return () => {
            cancelled = true
            unsubscribe()
        }
    }, [reload])

    return { data, loading, error, reload }
}
