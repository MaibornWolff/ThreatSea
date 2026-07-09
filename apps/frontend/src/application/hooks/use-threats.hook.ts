import { useCallback } from "react";
import type { ExtendedThreat, Threat } from "#api/types/threat.types.ts";
import { ThreatsActions } from "#application/actions/threats.actions.ts";
import { threatsSelectors } from "#application/selectors/threats.selectors.ts";
import { useAppDispatch, useAppSelector } from "./use-app-redux.hook";

export const useThreats = ({ projectId }: { projectId: number }) => {
    const dispatch = useAppDispatch();
    const items = useAppSelector((state) => threatsSelectors.selectByProjectId(state, projectId));
    const isPending = useAppSelector((state) => state.threats.isPending);

    const loadThreats = useCallback(() => {
        dispatch(ThreatsActions.getThreats({ projectId }));
    }, [projectId, dispatch]);

    const deleteThreat = (threat: Threat) => {
        dispatch(ThreatsActions.deleteThreat(threat));
    };

    const duplicateThreat = ({
        name,
        description,
        pointOfAttackId,
        projectId,
        catalogThreatId,
        pointOfAttack,
        attacker,
        probability,
        confidentiality,
        integrity,
        availability,
        doneEditing,
    }: ExtendedThreat) => {
        const filteredThreats = items.filter(
            (item) =>
                item.pointOfAttackId === pointOfAttackId &&
                item.attacker === attacker &&
                item.pointOfAttack === pointOfAttack
        );
        const namePostfix = " (" + filteredThreats.length + ")";
        dispatch(
            ThreatsActions.createThreat({
                name: name + namePostfix,
                description,
                pointOfAttackId,
                projectId,
                catalogThreatId,
                pointOfAttack,
                attacker,
                probability,
                confidentiality,
                integrity,
                availability,
                doneEditing,
            })
        );
    };

    return {
        items,
        isPending,
        loadThreats,
        deleteThreat,
        duplicateThreat,
    };
};
