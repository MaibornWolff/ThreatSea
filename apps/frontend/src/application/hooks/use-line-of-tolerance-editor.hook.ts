import { useEffect, useState } from "react";
import { useBlocker } from "react-router";
import type { Project } from "#api/types/project.types.ts";
import { ProjectsActions } from "#application/actions/projects.actions.ts";
import type { UnsavedLineOfToleranceDialogProps } from "#view/dialogs/unsaved-line-of-tolerance.dialog.tsx";
import { useAppDispatch } from "./use-app-redux.hook.ts";

interface UseLineOfToleranceEditorArgs {
    project: Pick<Project, "id" | "lineOfToleranceGreen" | "lineOfToleranceRed">;
    currentGreenValue: number;
    currentRedValue: number;
    setLineOfTolerance: (lineOfToleranceGreen: number, lineOfToleranceRed: number) => void;
    resetLineOfTolerance: () => void;
}

/**
 * Saving, resetting and guarding unsaved line of tolerance changes on the risk page.
 */
export const useLineOfToleranceEditor = ({
    project,
    currentGreenValue,
    currentRedValue,
    setLineOfTolerance,
    resetLineOfTolerance,
}: UseLineOfToleranceEditorArgs) => {
    const dispatch = useAppDispatch();
    const [isSaving, setIsSaving] = useState<boolean>(false);

    // Slider changes are a preview only; they are persisted on explicit save.
    const isDirty =
        currentGreenValue !== project.lineOfToleranceGreen || currentRedValue !== project.lineOfToleranceRed;

    // warn on unsaved changes when leaving the page
    useEffect(() => {
        if (!isDirty) {
            return;
        }
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isDirty]);

    // Dialogs of the risk page are nested routes, so only navigating outside of it is blocked.
    const riskPath = `/projects/${project.id}/risk`;
    const unsavedChangesBlocker = useBlocker(
        ({ nextLocation }) =>
            isDirty && nextLocation.pathname !== riskPath && !nextLocation.pathname.startsWith(`${riskPath}/`)
    );

    const save = async () => {
        setIsSaving(true);
        const result = await dispatch(
            ProjectsActions.updateProjectLineOfTolerance({
                id: project.id,
                lineOfToleranceGreen: currentGreenValue,
                lineOfToleranceRed: currentRedValue,
            })
        );
        setIsSaving(false);
        return result;
    };

    const handleChange = ([newGreenValue, newRedValue]: [number, number]) => {
        setLineOfTolerance(newGreenValue, newRedValue);
    };

    const handleSave = () => {
        void save();
    };

    const handleReset = () => {
        resetLineOfTolerance();
    };

    const handleStayOnPage = () => {
        unsavedChangesBlocker.reset?.();
    };

    const handleDiscardAndLeave = () => {
        resetLineOfTolerance();
        unsavedChangesBlocker.proceed?.();
    };

    const handleSaveAndLeave = async () => {
        const result = await save();
        if (ProjectsActions.updateProjectLineOfTolerance.fulfilled.match(result)) {
            unsavedChangesBlocker.proceed?.();
        } else {
            unsavedChangesBlocker.reset?.();
        }
    };

    const unsavedChangesDialogProps: UnsavedLineOfToleranceDialogProps = {
        open: unsavedChangesBlocker.state === "blocked",
        isSaving,
        onStay: handleStayOnPage,
        onDiscard: handleDiscardAndLeave,
        onSave: () => void handleSaveAndLeave(),
    };

    return {
        isDirty,
        isSaving,
        handleChange,
        handleSave,
        handleReset,
        unsavedChangesDialogProps,
    };
};
