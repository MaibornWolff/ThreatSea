import { exportAsJsonFile } from "../../utils/export";
import { useDispatch } from "react-redux";
import { ProjectsActions } from "../actions/projects.actions";

/**
 * Exports the project as JSON file
 * @event ExportIconButton#onClick
 */
export const useProjectExport = () => {
    const dispatch = useDispatch();

    const exportProject = (project) => {
        const fileName = project.name + "_export.json";
        dispatch(ProjectsActions.exportProjectToJson(project.id)).then((res) => {
            exportAsJsonFile(fileName, res.payload);
        });
    };

    return { exportProject };
};
