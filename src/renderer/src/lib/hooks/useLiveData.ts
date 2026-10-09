import { useEffect, useState, useCallback } from "react";

/**
 * Subscribes to a piece of data from the main process and refreshes
 * it whenever any window mutates the database.
 */
export function useLiveData<T>(
    fetcher: () => Promise<T>,
    initial: T,
): { data: T; loading: boolean; reload: () => Promise<void> } {
    const [data, setData] = useState<T>(initial);
    const [loading, setLoading] = useState(true);

    const reload = useCallback(async (): Promise<void> => {
        const next = await fetcher();
        setData(next);
        setLoading(false);
    }, [fetcher]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const next = await fetcher();
            if (!cancelled) {
                setData(next);
                setLoading(false);
            }
        })();

        const unsubscribe = window.api.onDataChanged(() => {
            fetcher().then((next) => {
                if (!cancelled) setData(next);
            });
        });

        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, [fetcher]);

    return { data, loading, reload };
}
