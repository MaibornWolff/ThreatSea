import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { socket } from "../../api/system-socket.api";
import { ThreatsActions } from "../actions/threats.actions";
import { threatsSelectors } from "../selectors/threats.selectors";

export const useThreats = ({ projectId }) => {
    const dispatch = useDispatch();
    const items = useSelector((state) => threatsSelectors.selectByProjectId(state, projectId));
    const isPending = useSelector((state) => state.threats.isPending);

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

    const deleteThreat = (threat) => {
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
        componentName,
    }) => {
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
                componentName,
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
