import { useParams, useNavigate, useLocation } from "react-router-dom";
import MeasureImpactByThreatDialog from "../dialogs/measureImpactByThreat.dialog";

/**
 * on this page a measureImpact can be created or edited
 *
 * @component
 * @category Pages
 * @return {JSX.Element}
 */
const MeasureImpactByThreatDialogPage = () => {
    const navigate = useNavigate();
    const { projectId } = useParams();
    let state = useLocation().state;

    if (state) {
        const { measure, project, measureImpact } = state;

        return (
            <MeasureImpactByThreatDialog
                project={project}
                open={true}
                measure={measure}
                measureImpact={measureImpact}
            />
        );
    } else {
        navigate(`/projects/${projectId}/measures`, { replace: true });

        return null;
    }
};

export default MeasureImpactByThreatDialogPage;
