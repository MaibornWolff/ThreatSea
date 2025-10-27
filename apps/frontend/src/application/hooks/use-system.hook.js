import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SystemActions } from "../actions/system.actions";
import { systemSelectors } from "../selectors/system.selectors";

export const useSystem = ({ projectId }) => {
    const dispatch = useDispatch();
    const isPending = useSelector((state) => state.system.pending);
    const components = useSelector((state) => systemSelectors.selectComponents(state, projectId));
    const connections = useSelector((state) => systemSelectors.selectConnections(state, projectId));
    const connectionPoints = useSelector((state) => systemSelectors.selectConnectionPoints(state, projectId));
    const pointsOfAttack = useSelector((state) => systemSelectors.selectPointsOfAttack(state, projectId));
    const hasSystemChanged = useSelector(systemSelectors.selectHasChanged);
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
