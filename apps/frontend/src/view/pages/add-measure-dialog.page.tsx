import { useParams, useLocation, Navigate, type Location } from "react-router-dom";
import type { Measure } from "#api/types/measure.types.ts";
import type { Project } from "#api/types/project.types.ts";
import AddMeasureDialog from "../dialogs/add-measure.dialog";

interface AddMeasureDialogLocationState {
    project: Project;
    measure: Partial<Measure> | undefined;
}

/**
 * on this page a measure can be created or edited
 *
 * @component
 * @category Pages
 * @return {JSX.Element}
 */
const AddMeasureDialogPage = () => {
    const { projectId = "" } = useParams<{ projectId?: string }>();
    const { state } = useLocation() as Location<AddMeasureDialogLocationState | undefined>;

    if (state) {
        const { project, measure } = state;

        return <AddMeasureDialog project={project} measure={measure} open={true} />;
    } else {
        return <Navigate to={`/projects/${projectId}/risk`} replace />;
    }
};

export default AddMeasureDialogPage;
