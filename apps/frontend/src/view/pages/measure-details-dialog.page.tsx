import { useParams, useNavigate, useLocation } from "react-router-dom";
import type { Location } from "react-router-dom";
import type { Project } from "#api/types/project.types.ts";
import type { Measure } from "#api/types/measure.types.ts";
import MeasureDetailsDialog from "../dialogs/measure-details.dialog";

/**
 * on this page a measure can be created or edited
 *
 * @component
 * @category Pages
 * @return {JSX.Element}
 */
interface MeasureDetailsDialogLocationState {
    measure: Measure;
    project: Project;
}

const MeasureDetailsDialogPage = () => {
    const navigate = useNavigate();
    const { projectId = "" } = useParams<{ projectId: string }>();
    const { state } = useLocation() as Location<MeasureDetailsDialogLocationState | undefined>;

    if (state) {
        const { measure, project } = state;

        return <MeasureDetailsDialog project={project} open={true} measure={measure} />;
    } else {
        navigate(`/projects/${projectId}/risk`, { replace: true });

        return null;
    }
};

export default MeasureDetailsDialogPage;
