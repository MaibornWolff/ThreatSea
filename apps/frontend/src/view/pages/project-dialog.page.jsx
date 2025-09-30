import AddProjectDialog from "../dialogs/add-project.dialog";
import { useLocation } from "react-router-dom";

/**
 * on this page a project can be created or edited
 *
 * @component
 * @category Pages
 * @return {Component}
 */
const ProjectDialogPage = () => {
    return <AddProjectDialog open={true} project={useLocation().state?.project} />;
};

export default ProjectDialogPage;
