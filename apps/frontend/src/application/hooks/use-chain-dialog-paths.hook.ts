import { useMemo } from "react";
import { generatePath, useMatch } from "react-router";

export type ChainDialogHost = "threats" | "measures" | "risk";

const isChainDialogHost = (value: string | undefined): value is ChainDialogHost =>
    value === "threats" || value === "measures" || value === "risk";

/**
 * Where each chain dialog (the dialogs that open each other) lives under each host page.
 * A page's own dialog keeps its short path, so `/threats/edit` stays `/threats/edit`.
 */
export const CHAIN_DIALOG_PATHS = {
    threats: {
        threat: "edit",
        measure: "measures/edit",
        measureImpactByThreat: "measures/:measureId/measureImpacts/edit",
        applyMeasure: "measureImpacts/edit",
    },
    measures: {
        threat: "threats/edit",
        measure: "edit",
        measureImpactByThreat: ":measureId/measureImpacts/edit",
        applyMeasure: "measureImpacts/edit",
    },
    risk: {
        threat: "threats/edit",
        measure: "measures/edit",
        measureImpactByThreat: "measures/:measureId/measureImpacts/edit",
        applyMeasure: "measureImpacts/edit",
    },
} as const satisfies Record<ChainDialogHost, Record<string, string>>;

/**
 * Builds chain-dialog URLs under the current host page, so opening one dialog from another
 * stays on the page the user started from.
 */
export const useChainDialogPaths = () => {
    const match = useMatch("/projects/:projectId/:hostPage/*");
    const projectId = match?.params.projectId;
    // Route matching is case-insensitive, so /projects/7/Threats renders ThreatsPage.
    const hostPage = match?.params.hostPage?.toLowerCase();
    if (projectId === undefined || !isChainDialogHost(hostPage)) {
        throw new Error("useChainDialogPaths must be used under /projects/:projectId/{threats,measures,risk}");
    }
    // Keyed on strings: callers put these paths into useCallback/useMemo dependencies.
    return useMemo(() => {
        const paths = CHAIN_DIALOG_PATHS[hostPage];
        const hostPath = `/projects/${projectId}/${hostPage}`;
        return {
            hostPath,
            threatPath: (threatId: number) => `${hostPath}/${paths.threat}?threatId=${threatId}`,
            measurePath: `${hostPath}/${paths.measure}`,
            measureImpactByThreatPath: (measureId: number) =>
                `${hostPath}/${generatePath(paths.measureImpactByThreat, { measureId: String(measureId) })}`,
            applyMeasurePath: `${hostPath}/${paths.applyMeasure}`,
        };
    }, [projectId, hostPage]);
};
