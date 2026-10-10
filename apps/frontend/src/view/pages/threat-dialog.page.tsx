import { Box, CircularProgress } from "@mui/material";
import { Navigate, useLocation, useParams, useSearchParams, type Location } from "react-router";
import { useEffect, useState } from "react";
import { useAppSelector } from "#application/hooks/use-app-redux.hook.ts";
import { useChainDialogPaths } from "#application/hooks/use-chain-dialog-paths.hook.ts";
import { GenericThreatsAPI } from "#api/generic-threats.api.ts";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import AddThreatDialog, { type ThreatTab } from "#view/dialogs/add-threat-dialog/add-threat.dialog.tsx";
import { ChainDialogContent } from "#view/components/chain-dialog-content.component.tsx";

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
    const { state } = useLocation() as Location<ThreatDialogLocationState | undefined>;
    const project = useAppSelector((state) => state.projects.current);
    const { hostPath } = useChainDialogPaths();

    // Navigating within the app carries the threat in location state (fast path), and a browser
    // reload keeps that state. A URL opened fresh (new tab, pasted link, bookmark) has none, so
    // re-fetch the threat by the id kept in the URL instead of dropping the user on the host page.
    const stateThreat = state?.threat;
    const [fetchedThreat, setFetchedThreat] = useState<ExtendedThreat | undefined>(undefined);
    const [fetchFailed, setFetchFailed] = useState(false);
    const threat = stateThreat ?? fetchedThreat;

    useEffect(() => {
        if (stateThreat || !threatIdParam) {
            return;
        }
        const threatId = Number(threatIdParam);
        // A malformed id can never match a threat — redirect without issuing the request.
        if (!Number.isInteger(threatId)) {
            setFetchFailed(true);
            return;
        }
        let cancelled = false;
        GenericThreatsAPI.getGenericThreatsWithExtendedThreats({ projectId: Number(projectId) })
            .then((genericThreats) => {
                if (cancelled) {
                    return;
                }
                const match = genericThreats
                    .flatMap((genericThreat) => genericThreat.threats)
                    .find((threat) => threat.id === threatId);
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
                threat={threat}
                project={project}
                userRole={userRole}
                {...(onSaved !== undefined ? { onSaved } : {})}
                {...(returnToTab !== undefined ? { initialTab: returnToTab } : {})}
            />
        );
    }

    // Nothing to reconstruct from (no id, or the threat no longer exists) → back to the host page.
    if (!threatIdParam || fetchFailed) {
        return <Navigate to={hostPath} replace />;
    }

    // A fresh URL is being reconstructed; fill the shell until the fetch resolves.
    return (
        <ChainDialogContent size="md">
            <Box sx={{ display: "flex", justifyContent: "center" }}>
                <CircularProgress size={24} />
            </Box>
        </ChainDialogContent>
    );
};

export default ThreatDialogPage;
