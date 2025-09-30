import { useParams, useNavigate, useLocation } from "react-router-dom";
import AddMeasureDialog from "../dialogs/add-measure.dialog";

/**
 * on this page a measure can be created or edited
 *
 * @component
 * @category Pages
 * @return {JSX.Element}
 */
const AddMeasureDialogPage = () => {
    const navigate = useNavigate();
    const { projectId } = useParams();
    let state = useLocation().state;

    if (state) {
        const { project, measure } = state;

        return <AddMeasureDialog project={project} measure={measure} open={true} />;
    } else {
        navigate(`/projects/${projectId}/risk`, { replace: true });

        return null;
    }
};

export default AddMeasureDialogPage;
