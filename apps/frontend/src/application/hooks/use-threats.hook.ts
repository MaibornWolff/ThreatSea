import { useCallback, useEffect } from "react";
import type { ExtendedThreat, Threat } from "#api/types/threat.types.ts";
import { socket } from "../../api/system-socket.api";
import { ThreatsActions } from "../actions/threats.actions";
import { threatsSelectors } from "../selectors/threats.selectors";
import { useAppDispatch, useAppSelector } from "./use-app-redux.hook";

export const useThreats = ({ projectId }: { projectId: number }) => {
    const dispatch = useAppDispatch();
    const items = useAppSelector((state) => threatsSelectors.selectByProjectId(state, projectId));
    const isPending = useAppSelector((state) => state.threats.isPending);

    useEffect(() => {
        socket.emit(
            "change_project",
            JSON.stringify({
                projectId: projectId,
            })
        );
        return () => {
            socket.emit("leave_project", JSON.stringify({}));
        };
    }, [projectId]);

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

    useEffect(() => {
        socket.on("set_threat", (data) => {
            const threat = JSON.parse(data);
            dispatch(ThreatsActions.setThreat(threat));
        });
        socket.on("remove_threat", (data) => {
            const threat = JSON.parse(data);
            dispatch(ThreatsActions.removeThreat(threat));
        });
    }, [dispatch]);

    return {
        items,
        isPending,
        loadThreats,
        deleteThreat,
        duplicateThreat,
    };
};
