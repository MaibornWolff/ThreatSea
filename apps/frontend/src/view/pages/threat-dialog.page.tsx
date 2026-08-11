import { Navigate, useLocation, useParams, useSearchParams, type Location } from "react-router";
import { useEffect, useState } from "react";
import { useAppSelector } from "#application/hooks/use-app-redux.hook.ts";
import { GenericThreatsAPI } from "#api/generic-threats.api.ts";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import AddThreatDialog, {
    type ThreatDialogHostRoute,
    type ThreatTab,
} from "#view/dialogs/add-threat-dialog/add-threat.dialog.tsx";

interface ThreatDialogLocationState {
    threat?: ExtendedThreat;
    returnToTab?: ThreatTab;
}

interface ThreatDialogPageProps {
    onSaved?: () => void;
}

/**
 * on this page a threat can be created or edited
 *
 * @component
 * @category Pages
 * @return {JSX.Element}
 */
const ThreatDialogPage = ({ onSaved }: ThreatDialogPageProps) => {
    const { projectId = "" } = useParams<{ projectId?: string }>();
    const [searchParams] = useSearchParams();
    const threatIdParam = searchParams.get("threatId");
    const userRole = useAppSelector((state) => state.projects.current?.role);
    const { state, pathname } = useLocation() as Location<ThreatDialogLocationState | undefined>;
    const project = useAppSelector((state) => state.projects.current);

    const hostRoute: ThreatDialogHostRoute = pathname.includes("/risk/")
        ? "risk"
        : pathname.includes("/measures/")
          ? "measures"
          : "threats";

    // Navigating within the app carries the threat in location state (fast path). After a browser
    // reload that state is gone, so re-fetch the threat by the id kept in the URL — this keeps the
    // dialog open across a reload instead of dropping the user back on the list.
    const stateThreat = state?.threat;
    const [fetchedThreat, setFetchedThreat] = useState<ExtendedThreat | undefined>(undefined);
    const [fetchFailed, setFetchFailed] = useState(false);
    const threat = stateThreat ?? fetchedThreat;

    useEffect(() => {
        if (stateThreat || !threatIdParam) {
            return;
        }
        let cancelled = false;
        const threatId = Number(threatIdParam);
        GenericThreatsAPI.getGenericThreatsWithExtendedChildren({ projectId: Number(projectId) })
            .then((genericThreats) => {
                if (cancelled) {
                    return;
                }
                const match = genericThreats
                    .flatMap((generic) => generic.children)
                    .find((child) => child.id === threatId);
                if (match) {
                    setFetchedThreat(match);
                } else {
                    setFetchFailed(true);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setFetchFailed(true);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [stateThreat, threatIdParam, projectId]);

    if (threat && project) {
        const returnToTab = state?.returnToTab;
        return (
            <AddThreatDialog
                open={true}
                threat={threat}
                project={project}
                userRole={userRole}
                hostRoute={hostRoute}
                {...(onSaved !== undefined ? { onSaved } : {})}
                {...(returnToTab !== undefined ? { initialTab: returnToTab } : {})}
            />
        );
    }

    // Nothing to reconstruct from (no id, or the threat no longer exists) → back to the list.
    if (!threatIdParam || fetchFailed) {
        return <Navigate to={`/projects/${projectId}/threats`} replace />;
    }

    // A reload is being reconstructed; the threats list shows behind until the fetch resolves.
    return null;
};

export default ThreatDialogPage;
