import { useCallback } from "react";
import { useLiveData } from "./useLiveData";
import type { Project } from "../../../../shared/types";

export function useProjects(): {
    projects: Project[];
    loading: boolean;
    reload: () => Promise<void>;
} {
    const fetcher = useCallback(() => window.api.getProjects(), []);
    const { data, loading, reload } = useLiveData<Project[]>(fetcher, []);
    return { projects: data, loading, reload };
}
