import { useCallback } from "react";
import { SystemActions } from "../actions/system.actions";
import { systemSelectors } from "../selectors/system.selectors";
import { useAppDispatch, useAppSelector } from "./use-app-redux.hook";

export const useSystem = ({ projectId }: { projectId: number }) => {
    const dispatch = useAppDispatch();
    const isPending = useAppSelector((state) => state.system.isPending);
    const components = useAppSelector((state) => systemSelectors.selectComponents(state, projectId));
    const connections = useAppSelector((state) => systemSelectors.selectConnections(state, projectId));
    const connectionPoints = useAppSelector((state) => systemSelectors.selectConnectionPoints(state, projectId));
    const pointsOfAttack = useAppSelector((state) => systemSelectors.selectPointsOfAttack(state, projectId));
    const hasSystemChanged = useAppSelector(systemSelectors.selectHasChanged);
    const initialized = useAppSelector((state) => state.system.initialized);

    const loadSystem = useCallback(() => {
        dispatch(SystemActions.getSystem({ projectId }));
    }, [dispatch, projectId]);

    const saveSystem = (image: string | null) => {
        dispatch(
            SystemActions.saveSystem({
                projectId,
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
