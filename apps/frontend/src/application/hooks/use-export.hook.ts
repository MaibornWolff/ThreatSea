import { exportAsJsonFile } from "../../utils/export";
import type { ExtendedProject } from "#api/types/project.types.ts";
import { ProjectsActions } from "../actions/projects.actions.ts";
import { useAppDispatch } from "./use-app-redux.hook.ts";

/**
 * Exports the project as JSON file
 */
export const useProjectExport = () => {
    const dispatch = useAppDispatch();

    const exportProject = async (project: Pick<ExtendedProject, "id" | "name">) => {
        const fileName = `${project.name}_export.json`;
        const resultAction = await dispatch(ProjectsActions.exportProjectToJson(project.id));
        if (resultAction?.payload && typeof resultAction.payload === "object") {
            exportAsJsonFile(fileName, resultAction.payload);
        }
    };

    return { exportProject };
};
