import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SystemActions } from "../actions/system.actions";
import SystemSelectors from "../selectors/system.selectors";

export const useSystem = ({ projectId }) => {
    const dispatch = useDispatch();
    const isPending = useSelector((state) => state.system.pending);
    const components = useSelector((state) => SystemSelectors.selectComponents(state, projectId));
    const connections = useSelector((state) => SystemSelectors.selectConnections(state, projectId));
    const connectionPoints = useSelector((state) => SystemSelectors.selectConnectionPoints(state, projectId));
    const pointsOfAttack = useSelector((state) => SystemSelectors.selectPointsOfAttack(state, projectId));
    const hasSystemChanged = useSelector(SystemSelectors.selectHasChanged);
    const initialized = useSelector((state) => state.system.initialized);

    const loadSystem = useCallback(() => {
        dispatch(SystemActions.getSystem({ projectId }));
    }, [dispatch, projectId]);

    const saveSystem = (image) => {
        dispatch(
            SystemActions.saveSystem({
                projectId: parseInt(projectId),
                image,
            })
        );
    };

    return {
        loadSystem,
        saveSystem,
        components,
        connections,
        connectionPoints,
        pointsOfAttack,
        hasSystemChanged,
        initialized,
        isPending,
    };
};
