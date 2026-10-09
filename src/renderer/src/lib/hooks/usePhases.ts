import { useCallback } from "react";
import { useLiveData } from "./useLiveData";
import type { ProjectPhase } from "../../../../shared/types";

export function usePhases(projectId: number): {
    phases: ProjectPhase[];
    loading: boolean;
    reload: () => Promise<void>;
} {
    const fetcher = useCallback(
        () => window.api.getPhases(projectId),
        [projectId],
    );
    const { data, loading, reload } = useLiveData<ProjectPhase[]>(fetcher, []);
    return { phases: data, loading, reload };
}
