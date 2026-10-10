import { useLocation, Navigate, type Location } from "react-router";
import { useChainDialogPaths } from "#application/hooks/use-chain-dialog-paths.hook.ts";
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

interface MeasureImpactByThreatDialogPageProps {
    onSaved?: () => void;
}

export const MeasureImpactByThreatDialogPage = ({ onSaved }: MeasureImpactByThreatDialogPageProps = {}) => {
    const { hostPath } = useChainDialogPaths();
    const { state } = useLocation() as Location<MeasureImpactByThreatDialogLocationState | undefined>;

    if (state) {
        const { measure, project, measureImpact } = state;

        return (
            <MeasureImpactByThreatDialog
                project={project}
                measure={measure}
                measureImpact={measureImpact ?? null}
                {...(onSaved !== undefined ? { onSaved } : {})}
            />
        );
    } else {
        return <Navigate to={hostPath} replace />;
    }
};
