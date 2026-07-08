import { useEffect, useRef } from "react";

/**
 * Calls `load()` exactly once per mount (or `projectId` change), but only
 * after `autoSaveStatus` has reached a stable state ("upToDate" or
 * "uninitialized"). This prevents double-fetches when a system save is still
 * in-flight at the moment the page mounts.
 */
export const useLoadThreatsOnce = ({
    projectId,
    autoSaveStatus,
    load,
}: {
    projectId: number;
    autoSaveStatus: string;
    load: () => void;
}): void => {
    const prevProjectIdRef = useRef(projectId);
    const loadedRef = useRef(false);
    useEffect(() => {
        if (prevProjectIdRef.current !== projectId) {
            prevProjectIdRef.current = projectId;
            loadedRef.current = false;
        }
        if (loadedRef.current) {
            return;
        }
        if (autoSaveStatus === "upToDate" || autoSaveStatus === "uninitialized") {
            loadedRef.current = true;
            load();
        }
    }, [projectId, autoSaveStatus, load]);
};
