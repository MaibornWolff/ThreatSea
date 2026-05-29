import { useParams, useLocation, Navigate } from "react-router-dom";
import type { Location } from "react-router-dom";
import type { Project } from "#api/types/project.types.ts";
import type { Measure } from "#api/types/measure.types.ts";
import type { MeasureImpact } from "#api/types/measure-impact.types.ts";
import MeasureImpactByThreatDialog from "#view/dialogs/measureImpactByThreat.dialog.tsx";

/**
 * on this page a measureImpact can be created or edited
 *
 * @component
 * @category Pages
 * @return {JSX.Element}
 */
interface MeasureImpactByThreatDialogLocationState {
    measure: Measure;
    project: Project;
    measureImpact?: MeasureImpact | null;
}

export const MeasureImpactByThreatDialogPage = () => {
    const { projectId = "" } = useParams<{ projectId: string }>();
    const { state } = useLocation() as Location<MeasureImpactByThreatDialogLocationState | undefined>;

    if (state) {
        const { measure, project, measureImpact } = state;

        return (
            <MeasureImpactByThreatDialog
                project={project}
                open={true}
                measure={measure}
                measureImpact={measureImpact ?? null}
            />
        );
    } else {
        return <Navigate to={`/projects/${projectId}/measures`} replace />;
    }
};
