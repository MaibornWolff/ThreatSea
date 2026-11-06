import { useCallback, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { ThreatsActions } from "#application/actions/threats.actions.ts";
import type { GenericThreatWithExtendedThreats } from "#api/types/generic-threat.types.ts";
import type { ExtendedThreat, Threat } from "#api/types/threat.types.ts";
import { THREAT_STATUSES } from "#api/types/threat-statuses.types.ts";
import { useAppDispatch } from "./use-app-redux.hook";
import { useChainDialogPaths } from "./use-chain-dialog-paths.hook";
import { useConfirm } from "./use-confirm.hook";
import type { ExtendedThreatWithMetrics } from "./use-generic-threats-list.hook";

/**
 * The row actions of the threats table: open a threat for editing, add a threat to a generic
 * threat, and duplicate or delete a threat. Every change reloads the list via `loadGenericThreats`.
 */
export const useThreatActions = ({
    projectId,
    threatsByGenericThreatId,
    expandedGenericThreatIds,
    toggleGenericThreat,
    loadGenericThreats,
}: {
    projectId: number;
    threatsByGenericThreatId: Record<number, ExtendedThreatWithMetrics[]>;
    expandedGenericThreatIds: Record<number, boolean>;
    toggleGenericThreat: (genericThreatId: number) => void;
    loadGenericThreats: () => Promise<void>;
}) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation("threatsPage");
    const { openConfirm } = useConfirm<Threat>();
    const { threatPath } = useChainDialogPaths();

    const onClickEditThreat = useCallback(
        (event: MouseEvent<HTMLElement>, threat: ExtendedThreat | undefined) => {
            event.preventDefault();
            if (threat) {
                navigate(threatPath(threat.id), { state: { threat } });
            }
        },
        [navigate, threatPath]
    );

    const handleAddThreat = useCallback(
        async (event: MouseEvent<HTMLElement>, genericThreat: GenericThreatWithExtendedThreats) => {
            event.preventDefault();
            // Keep the add button from toggling the generic threat row's expand/collapse.
            event.stopPropagation();
            try {
                // Only the name is overridden; identity and assessment defaults come
                // from the generic threat and its catalogue threat on the backend.
                await dispatch(
                    ThreatsActions.createThreat({
                        projectId,
                        genericThreatId: genericThreat.id,
                        name: `${genericThreat.name} (${t("newThreatSuffix")})`,
                    })
                ).unwrap();
                if (!expandedGenericThreatIds[genericThreat.id]) {
                    toggleGenericThreat(genericThreat.id);
                }
                void loadGenericThreats();
            } catch {
                // handled globally
            }
        },
        [dispatch, projectId, t, expandedGenericThreatIds, toggleGenericThreat, loadGenericThreats]
    );

    const handleDuplicateThreat = useCallback(
        (event: MouseEvent<HTMLElement>, threat: Threat) => {
            event.preventDefault();
            openConfirm({
                state: threat,
                message: t("duplicateMessage", { threatName: threat.name }),
                acceptText: t("duplicate"),
                cancelText: t("cancel"),
                acceptColor: "secondary",
                onAccept: async (threat) => {
                    try {
                        const payload = {
                            projectId,
                            genericThreatId: threat.genericThreatId,
                            name: `${threat.name} (${t("duplicateSuffix")})`,
                            description: threat.description,
                            probability: threat.probability,
                            confidentiality: threat.confidentiality,
                            integrity: threat.integrity,
                            availability: threat.availability,
                            status: THREAT_STATUSES.NEW,
                        };

                        await dispatch(ThreatsActions.createThreat(payload)).unwrap();
                        void loadGenericThreats();
                    } catch {
                        // swallow; error handling via global error handler
                    }
                },
            });
        },
        [openConfirm, t, dispatch, projectId, loadGenericThreats]
    );

    const handleDeleteThreat = useCallback(
        (event: MouseEvent<HTMLElement>, threat: Threat) => {
            event.preventDefault();
            // Prevent deleting the only threat of a generic threat
            const siblings = threatsByGenericThreatId[threat.genericThreatId] ?? [];
            if (siblings.length <= 1) {
                openConfirm({
                    state: threat,
                    message: t("cannotDeleteOnlyThreat", { threatName: threat.name }),
                    acceptText: t("ok"),
                    // Informational dialog — no action to cancel (same pattern as the
                    // member page's warning dialogs).
                    cancelText: null,
                });
                return;
            }

            openConfirm({
                state: threat,
                message: t("deleteMessage", { threatName: threat.name }),
                acceptText: t("delete"),
                cancelText: t("cancel"),
                onAccept: async (threat) => {
                    try {
                        await dispatch(
                            ThreatsActions.deleteThreat({ id: threat.id, projectId, name: threat.name })
                        ).unwrap();
                        void loadGenericThreats();
                    } catch {
                        // handled globally
                    }
                },
            });
        },
        [threatsByGenericThreatId, openConfirm, t, dispatch, projectId, loadGenericThreats]
    );

    return { onClickEditThreat, handleAddThreat, handleDuplicateThreat, handleDeleteThreat };
};
