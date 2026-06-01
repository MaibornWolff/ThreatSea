import { useParams, useLocation, Navigate } from "react-router-dom";
import type { Location } from "react-router-dom";
import type { Project } from "#api/types/project.types.ts";
import type { MeasureImpact } from "#api/types/measure-impact.types.ts";
import MeasureImpactByMeasureDialog, { type ApplyMeasureThreat } from "#view/dialogs/measureImpactByMeasure.dialog.tsx";

/**
 * on this page a measureImpact can be created or edited
 *
 * @component
 * @category Pages
 * @return {JSX.Element}
 */
interface MeasureImpactByMeasureDialogLocationState {
    threat: ApplyMeasureThreat;
    project: Project;
    measureImpact?: MeasureImpact | null;
}

export const MeasureImpactByMeasureDialogPage = () => {
    const { projectId = "" } = useParams<{ projectId: string }>();
    const { state } = useLocation() as Location<MeasureImpactByMeasureDialogLocationState | undefined>;

    if (state) {
        const { threat, project, measureImpact } = state;

        return (
            <MeasureImpactByMeasureDialog
                project={project}
                open={true}
                threat={threat}
                measureImpact={measureImpact ?? null}
            />
        );
    } else {
        return <Navigate to={`/projects/${projectId}/risk`} replace />;
    }
};
