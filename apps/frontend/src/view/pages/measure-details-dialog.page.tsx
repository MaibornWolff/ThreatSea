import { useParams, useLocation, Navigate, type Location } from "react-router";
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
    returnToTab?: "MAIN" | "THREATS";
}

const MeasureDetailsDialogPage = () => {
    const { projectId = "" } = useParams<{ projectId: string }>();
    const { state } = useLocation() as Location<MeasureDetailsDialogLocationState | undefined>;

    if (state) {
        const { measure, project, returnToTab } = state;

        return (
            <MeasureDetailsDialog
                project={project}
                open={true}
                measure={measure}
                {...(returnToTab !== undefined ? { initialTab: returnToTab } : {})}
            />
        );
    } else {
        return <Navigate to={`/projects/${projectId}/risk`} replace />;
    }
};

export default MeasureDetailsDialogPage;
