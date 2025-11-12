import { useParams, useNavigate, useLocation } from "react-router-dom";
import type { Location } from "react-router-dom";
import type { Project } from "#api/types/project.types.ts";
import type { Measure } from "#api/types/measure.types.ts";
import type { MeasureImpact } from "#api/types/measure-impact.types.ts";
import MeasureImpactByThreatDialog from "../dialogs/measureImpactByThreat.dialog";

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
    const navigate = useNavigate();
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
        navigate(`/projects/${projectId}/measures`, { replace: true });

        return null;
    }
};
