import { useParams, useLocation, Navigate } from "react-router-dom";
import type { Location } from "react-router-dom";
import type { Project } from "#api/types/project.types.ts";
import type { Measure } from "#api/types/measure.types.ts";
import MeasureDetailsDialog from "#view/dialogs/measure-details.dialog.tsx";

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
    const { projectId = "" } = useParams<{ projectId: string }>();
    const { state } = useLocation() as Location<MeasureDetailsDialogLocationState | undefined>;

    if (state) {
        const { measure, project } = state;

        return <MeasureDetailsDialog project={project} open={true} measure={measure} />;
    } else {
        return <Navigate to={`/projects/${projectId}/risk`} replace />;
    }
};

export default MeasureDetailsDialogPage;
