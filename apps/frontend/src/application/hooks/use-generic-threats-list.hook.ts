import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { GenericThreatsAPI } from "#api/generic-threats.api.ts";
import type { GenericThreatWithExtendedChildren } from "#api/types/generic-threat.types.ts";
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
    // `attacker` and `pointOfAttack` are stored as language-neutral enum codes but shown to the
    // user through these translation tables, so the search must match the localized label the user
    // actually sees — not the raw code (which is English-derived and never matches German input).
    const { t } = useTranslation("common");
    const dispatch = useAppDispatch();
    const [isPending, setIsPending] = useState<boolean>(false);
    const [genericThreats, setGenericThreats] = useState<GenericThreatWithExtendedChildren[]>([]);
    const [searchValue, setSearchValue] = useState<string>("");

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
            const threats = await GenericThreatsAPI.getGenericThreatsWithExtendedChildren({ projectId });
            if (sequence !== loadSequenceRef.current) {
                return;
            }
            const sortedThreats = [...threats].sort((a, b) =>
                a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
            );
            setGenericThreats(sortedThreats);

            if (sortedThreats.length === 0) {
                setThreatsByGenericThreatId({});
                return;
            }

            const threatsMap = sortedThreats.reduce<Record<number, ExtendedThreatWithMetrics[]>>((result, threat) => {
                result[threat.id] = threat.children.map((threat) => {
                    const damage = calcDamage(threat);
                    return {
                        ...threat,
                        damage,
                        risk: threat.probability * damage,
                    };
                });
                return result;
            }, {});
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

    const filteredGenericThreats = useMemo(() => {
        const normalizedSearch = searchValue.toLowerCase().trim();

        if (!normalizedSearch) {
            return genericThreats;
        }

        return genericThreats.filter((genericThreat) => {
            const attackerLabel = t(`attackerList.${genericThreat.attacker}`).toLowerCase();
            const pointOfAttackLabel = t(`pointsOfAttackList.${genericThreat.pointOfAttack}`).toLowerCase();
            const genericThreatMatches =
                genericThreat.name.toLowerCase().includes(normalizedSearch) ||
                genericThreat.description.toLowerCase().includes(normalizedSearch) ||
                attackerLabel.includes(normalizedSearch) ||
                pointOfAttackLabel.includes(normalizedSearch);

            if (genericThreatMatches) {
                return true;
            }

            const threats = threatsByGenericThreatId[genericThreat.id] ?? [];
            return threats.some(
                (threat) =>
                    threat.name.toLowerCase().includes(normalizedSearch) ||
                    threat.description.toLowerCase().includes(normalizedSearch)
            );
        });
    }, [threatsByGenericThreatId, genericThreats, searchValue, t]);

    // Scoped to the parents the user can currently see: with a search active,
    // expand/collapse-all must not silently change hidden parents' state.
    const setAllGenericThreatsExpanded = useCallback(
        (expanded: boolean) => {
            setExpandedGenericThreatIds((previous) => {
                const next = { ...previous };
                for (const genericThreat of filteredGenericThreats) {
                    if (expanded) {
                        next[genericThreat.id] = true;
                    } else {
                        delete next[genericThreat.id];
                    }
                }
                return next;
            });
        },
        [filteredGenericThreats]
    );

    return {
        isPending,
        searchValue,
        setSearchValue,
        loadGenericThreats,
        genericThreats: filteredGenericThreats,
        expandedGenericThreatIds,
        threatsByGenericThreatId,
        toggleGenericThreat,
        setAllGenericThreatsExpanded,
    };
};
