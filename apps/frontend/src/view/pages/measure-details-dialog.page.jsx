import { useParams, useNavigate, useLocation } from "react-router-dom";
import MeasureDetailsDialog from "../dialogs/measure-details.dialog";

/**
 * on this page a measure can be created or edited
 *
 * @component
 * @category Pages
 * @return {JSX.Element}
 */
const MeasureDetailsDialogPage = () => {
    const navigate = useNavigate();
    const { projectId } = useParams();
    let state = useLocation().state;

    if (state) {
        const { measure, project } = state;

        return <MeasureDetailsDialog project={project} open={true} measure={measure} />;
    } else {
        navigate(`/projects/${projectId}/risk`, { replace: true });

        return null;
    }
};

export default MeasureDetailsDialogPage;
