import { useState } from "react";
import { useParams, useLocation, Navigate, Outlet, type Location } from "react-router";
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
    threat?: ApplyMeasureThreat;
    project: Project;
    measureImpact?: MeasureImpact | null;
}

interface MeasureImpactByMeasureDialogPageProps {
    onApplied?: () => void;
}

export const MeasureImpactByMeasureDialogPage = ({ onApplied }: MeasureImpactByMeasureDialogPageProps = {}) => {
    const { projectId = "" } = useParams<{ projectId: string }>();
    const { state: locationState } = useLocation() as Location<MeasureImpactByMeasureDialogLocationState | undefined>;
    // Capture the initial location state at mount time so that when the child route
    // (measures/add) is active and useLocation() reflects the child's state, the
    // parent dialog retains its original threat/project/measureImpact data.
    const [state] = useState(locationState);

    const threat = state?.threat;

    if (state && threat) {
        const { project, measureImpact } = state;

        return (
            <>
                <MeasureImpactByMeasureDialog
                    project={project}
                    open={true}
                    threat={threat}
                    measureImpact={measureImpact ?? null}
                    {...(onApplied !== undefined ? { onApplied } : {})}
                />
                <Outlet />
            </>
        );
    } else {
        return <Navigate to={`/projects/${projectId}/risk`} replace />;
    }
};
