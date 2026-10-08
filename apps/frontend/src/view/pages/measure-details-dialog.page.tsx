import { useLocation, Navigate, type Location } from "react-router";
import { useChainDialogPaths } from "#application/hooks/use-chain-dialog-paths.hook.ts";
import type { Project } from "#api/types/project.types.ts";
import type { Measure } from "#api/types/measure.types.ts";
import MeasureDetailsDialog, { type MeasureDetailsTab } from "#view/dialogs/measure-details.dialog.tsx";

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
    returnToTab?: MeasureDetailsTab;
}

const MeasureDetailsDialogPage = () => {
    const { hostPath } = useChainDialogPaths();
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
        return <Navigate to={hostPath} replace />;
    }
};

export default MeasureDetailsDialogPage;
