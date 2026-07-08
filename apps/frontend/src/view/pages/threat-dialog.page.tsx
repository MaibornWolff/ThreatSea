import { Navigate, useLocation, useParams, type Location } from "react-router";
import { useAppSelector } from "#application/hooks/use-app-redux.hook.ts";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import AddThreatDialog, {
    type ThreatDialogHostRoute,
    type ThreatTab,
} from "#view/dialogs/add-threat-dialog/add-threat.dialog.tsx";

interface ThreatDialogLocationState {
    threat?: ExtendedThreat;
    childThreat?: ExtendedThreat;
    returnToTab?: ThreatTab;
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
    const { state, pathname } = useLocation() as Location<ThreatDialogLocationState | undefined>;
    const threat = state?.childThreat ?? state?.threat;
    const project = useAppSelector((state) => state.projects.current);

    const hostRoute: ThreatDialogHostRoute = pathname.includes("/risk/")
        ? "risk"
        : pathname.includes("/measures/")
          ? "measures"
          : "threats";

    if (threat && project) {
        const returnToTab = state?.returnToTab;
        return (
            <AddThreatDialog
                open={true}
                threat={threat}
                project={project}
                userRole={userRole}
                hostRoute={hostRoute}
                {...(returnToTab !== undefined ? { initialTab: returnToTab } : {})}
            />
        );
    } else {
        return <Navigate to={`/projects/${projectId}/threats`} replace />;
    }
};

export default ThreatDialogPage;
