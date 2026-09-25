import { useCallback, useEffect, useRef, useState } from "react";
import { GenericThreatsAPI } from "#api/generic-threats.api.ts";
import type { GenericThreatWithExtendedThreats } from "#api/types/generic-threat.types.ts";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import { calcDamage } from "#utils/helpers.ts";
import { ErrorActions } from "#application/actions/error.actions.ts";
import { toSerializedError } from "#utils/serialize-error.ts";
import { useAppDispatch } from "./use-app-redux.hook";

export type ExtendedThreatWithMetrics = ExtendedThreat & {
    damage: number;
    risk: number;
};

export const useGenericThreatsList = ({ projectId }: { projectId: number }) => {
    const dispatch = useAppDispatch();
    const [isPending, setIsPending] = useState<boolean>(false);
    const [genericThreats, setGenericThreats] = useState<GenericThreatWithExtendedThreats[]>([]);

    const [expandedGenericThreatIds, setExpandedGenericThreatIds] = useState<Record<number, boolean>>({});
    const [threatsByGenericThreatId, setThreatsByGenericThreatId] = useState<
        Record<number, ExtendedThreatWithMetrics[]>
    >({});

    // loadGenericThreats is fired from mount, the autosave effect, and after every mutation, so
    // calls can overlap. Track a per-call sequence and apply results only for the latest one, so
    // a slower older response can't overwrite newer data or clear pending while a newer load runs.
    const loadSequenceRef = useRef(0);

    const loadGenericThreats = useCallback(async () => {
        const sequence = ++loadSequenceRef.current;
        setIsPending(true);
        try {
            const loadedGenericThreats = await GenericThreatsAPI.getGenericThreatsWithExtendedThreats({ projectId });
            if (sequence !== loadSequenceRef.current) {
                return;
            }
            const sortedGenericThreats = [...loadedGenericThreats].sort((a, b) =>
                a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
            );
            setGenericThreats(sortedGenericThreats);

            if (sortedGenericThreats.length === 0) {
                setThreatsByGenericThreatId({});
                return;
            }

            const threatsMap = sortedGenericThreats.reduce<Record<number, ExtendedThreatWithMetrics[]>>(
                (result, genericThreat) => {
                    result[genericThreat.id] = genericThreat.threats.map((threat) => {
                        const damage = calcDamage(threat);
                        return {
                            ...threat,
                            damage,
                            risk: threat.probability * damage,
                        };
                    });
                    return result;
                },
                {}
            );
            setThreatsByGenericThreatId(threatsMap);
        } catch (error) {
            if (sequence !== loadSequenceRef.current) {
                return;
            }
            // Surface through the global error state, like the redux thunks do
            // via the error middleware; keep any previously loaded threats.
            dispatch(ErrorActions.setAPIError(toSerializedError(error)));
        } finally {
            // Only the latest load owns the pending flag; an older one finishing must not
            // clear it while the newer request is still in flight.
            if (sequence === loadSequenceRef.current) {
                setIsPending(false);
            }
        }
    }, [projectId, dispatch]);

    useEffect(() => {
        void loadGenericThreats();
    }, [loadGenericThreats]);

    const toggleGenericThreat = useCallback((genericThreatId: number) => {
        setExpandedGenericThreatIds((previous) => ({
            ...previous,
            [genericThreatId]: !previous[genericThreatId],
        }));
    }, []);

    const setAllGenericThreatsExpanded = useCallback(
        (expanded: boolean) => {
            setExpandedGenericThreatIds((previous) => {
                const next = { ...previous };
                for (const genericThreat of genericThreats) {
                    if (expanded) {
                        next[genericThreat.id] = true;
                    } else {
                        delete next[genericThreat.id];
                    }
                }
                return next;
            });
        },
        [genericThreats]
    );

    return {
        isPending,
        loadGenericThreats,
        genericThreats,
        expandedGenericThreatIds,
        threatsByGenericThreatId,
        toggleGenericThreat,
        setAllGenericThreatsExpanded,
    };
};
