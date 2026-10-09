import { useCallback } from "react";
import { useLiveData } from "./useLiveData";
import type { Task } from "../../../../shared/types";

export function useTasksByView(view: "today" | "tomorrow" | "all"): {
    tasks: Task[];
    loading: boolean;
    reload: () => Promise<void>;
} {
    const fetcher = useCallback(() => window.api.getTasksByView(view), [view]);
    const { data, loading, reload } = useLiveData<Task[]>(fetcher, []);
    return { tasks: data, loading, reload };
}

export function useTasksByProject(projectId: number): {
    tasks: Task[];
    loading: boolean;
    reload: () => Promise<void>;
} {
    const fetcher = useCallback(
        () => window.api.getTasksByProject(projectId),
        [projectId],
    );
    const { data, loading, reload } = useLiveData<Task[]>(fetcher, []);
    return { tasks: data, loading, reload };
}
