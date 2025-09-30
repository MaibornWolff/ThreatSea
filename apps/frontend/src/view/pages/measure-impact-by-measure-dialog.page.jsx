import { useParams, useNavigate, useLocation } from "react-router-dom";
import MeasureImpactByMeasureDialog from "../dialogs/measureImpactByMeasure.dialog";

/**
 * on this page a measureImpact can be created or edited
 *
 * @component
 * @category Pages
 * @return {JSX.Element}
 */
const MeasureImpactByMeasureDialogPage = () => {
    const navigate = useNavigate();
    const { projectId } = useParams();
    let state = useLocation().state;

    if (state) {
        const { threat, project, measureImpact } = state;

        return (
            <MeasureImpactByMeasureDialog project={project} open={true} threat={threat} measureImpact={measureImpact} />
        );
    } else {
        navigate(`/projects/${projectId}/risk`, { replace: true });

        return null;
    }
};

export default MeasureImpactByMeasureDialogPage;
