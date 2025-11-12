import { useParams, useNavigate, useLocation } from "react-router-dom";
import type { Location } from "react-router-dom";
import type { Project } from "#api/types/project.types.ts";
import type { MeasureImpact } from "#api/types/measure-impact.types.ts";
import MeasureImpactByMeasureDialog from "../dialogs/measureImpactByMeasure.dialog";
import type { ThreatWithMetrics } from "#application/hooks/use-matrix.hook.ts";

/**
 * on this page a measureImpact can be created or edited
 *
 * @component
 * @category Pages
 * @return {JSX.Element}
 */
interface MeasureImpactByMeasureDialogLocationState {
    threat: ThreatWithMetrics;
    project: Project;
    measureImpact?: MeasureImpact | null;
}

export const MeasureImpactByMeasureDialogPage = () => {
    const navigate = useNavigate();
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
        navigate(`/projects/${projectId}/risk`, { replace: true });

        return null;
    }
};
