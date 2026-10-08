import { useLocation, Navigate, type Location } from "react-router";
import { useChainDialogPaths } from "#application/hooks/use-chain-dialog-paths.hook.ts";
import type { Measure } from "#api/types/measure.types.ts";
import type { Project } from "#api/types/project.types.ts";
import AddMeasureDialog from "#view/dialogs/add-measure.dialog.tsx";

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
    const { hostPath } = useChainDialogPaths();
    const { state } = useLocation() as Location<AddMeasureDialogLocationState | undefined>;

    if (state) {
        const { project, measure } = state;

        return <AddMeasureDialog project={project} measure={measure} open={true} />;
    } else {
        return <Navigate to={hostPath} replace />;
    }
};

export default AddMeasureDialogPage;
