import { Navigate, useLocation, useParams, type Location } from "react-router";
import { useAppSelector } from "#application/hooks/use-app-redux.hook.ts";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import AddThreatDialog from "#view/dialogs/add-threat-dialog/add-threat.dialog.tsx";

interface ThreatDialogLocationState {
    threat: ExtendedThreat | undefined;
    returnToTab?: "MAIN" | "ASSETS" | "MEASURES";
}

/**
 * on this page a threat can be created or edited
 *
 * @component
 * @category Pages
 * @return {JSX.Element}
 */
const ThreatDialogPage = () => {
    const { projectId = "" } = useParams<{ projectId?: string }>();
    const userRole = useAppSelector((state) => state.projects.current?.role);
    const { state } = useLocation() as Location<ThreatDialogLocationState | undefined>;
    const threat = state?.threat;
    const project = useAppSelector((state) => state.projects.current);

    if (threat && project) {
        const returnToTab = state?.returnToTab;
        return (
            <AddThreatDialog
                open={true}
                threat={threat}
                project={project}
                userRole={userRole}
                {...(returnToTab !== undefined ? { initialTab: returnToTab } : {})}
            />
        );
    } else {
        return <Navigate to={`/projects/${projectId}/threats`} replace />;
    }
};

export default ThreatDialogPage;
