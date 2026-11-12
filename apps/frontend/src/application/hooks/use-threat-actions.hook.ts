import { useCallback, useRef, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { ThreatsActions } from "#application/actions/threats.actions.ts";
import { MeasureImpactsApi } from "#api/measureImpacts.api.ts";
import type { GenericThreatWithExtendedThreats } from "#api/types/generic-threat.types.ts";
import type { ExtendedThreat, Threat } from "#api/types/threat.types.ts";
import { THREAT_STATUSES } from "#api/types/threat-statuses.types.ts";
import { useAppDispatch } from "./use-app-redux.hook";
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

    const onClickEditThreat = useCallback(
        (event: MouseEvent<HTMLElement>, threat: ExtendedThreat | undefined) => {
            event.preventDefault();
            if (threat) {
                navigate(`/projects/${projectId}/threats/edit?threatId=${threat.id}`, { state: { threat } });
            }
        },
        [navigate, projectId]
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

    // Deleting a new threat needs no confirmation, so several deletes can run before the list
    // reloads. Threats stay in here until the reloaded list no longer shows them, so the
    // only-threat check below does not count them.
    const threatIdsBeingDeletedRef = useRef(new Set<number>());

    const deleteThreat = useCallback(
        async (threat: Threat) => {
            threatIdsBeingDeletedRef.current.add(threat.id);
            try {
                await dispatch(ThreatsActions.deleteThreat({ id: threat.id, projectId, name: threat.name })).unwrap();
                void loadGenericThreats().finally(() => threatIdsBeingDeletedRef.current.delete(threat.id));
            } catch {
                threatIdsBeingDeletedRef.current.delete(threat.id);
                // the error itself is handled globally
            }
        },
        [dispatch, projectId, loadGenericThreats]
    );

    // A threat stays "new" when a measure that does not set it out of scope is applied, and
    // deleting the threat deletes those measure impacts too, so check for them before skipping
    // the confirmation.
    const isUntouchedThreat = useCallback(
        async (threat: Threat) => {
            if (threat.status !== THREAT_STATUSES.NEW) {
                return false;
            }
            try {
                const measureImpacts = await MeasureImpactsApi.getMeasureImpacts({ projectId });
                return !measureImpacts.some((measureImpact) => measureImpact.threatId === threat.id);
            } catch {
                return false;
            }
        },
        [projectId]
    );

    const handleDeleteThreat = useCallback(
        async (event: MouseEvent<HTMLElement>, threat: Threat) => {
            event.preventDefault();
            const threatIdsBeingDeleted = threatIdsBeingDeletedRef.current;
            if (threatIdsBeingDeleted.has(threat.id)) {
                return;
            }
            // Prevent deleting the only threat of a generic threat
            const siblings = (threatsByGenericThreatId[threat.genericThreatId] ?? []).filter(
                (sibling) => !threatIdsBeingDeleted.has(sibling.id)
            );
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

            // Counted as being deleted while the check runs, so a second click cannot pass the
            // only-threat check meanwhile.
            threatIdsBeingDeleted.add(threat.id);
            // Nothing of the user's would be lost, so there is nothing to confirm.
            if (await isUntouchedThreat(threat)) {
                await deleteThreat(threat);
                return;
            }
            threatIdsBeingDeleted.delete(threat.id);

            openConfirm({
                state: threat,
                message: t("deleteMessage", { threatName: threat.name }),
                acceptText: t("delete"),
                cancelText: t("cancel"),
                onAccept: deleteThreat,
            });
        },
        [threatsByGenericThreatId, openConfirm, t, isUntouchedThreat, deleteThreat]
    );

    return { onClickEditThreat, handleAddThreat, handleDuplicateThreat, handleDeleteThreat };
};
