import { useLocation, type Location } from "react-router-dom";
import type { Project } from "#api/types/project.types.ts";
import AddProjectDialog from "../dialogs/add-project.dialog";

interface ProjectDialogLocationState {
    project: Partial<Project> | undefined;
}

/**
 * on this page a project can be created or edited
 *
 * @component
 * @category Pages
 * @return {Component}
 */
const ProjectDialogPage = () => {
    const { state } = useLocation() as Location<ProjectDialogLocationState | undefined>;
    return <AddProjectDialog open={true} project={state?.project} />;
};

export default ProjectDialogPage;
