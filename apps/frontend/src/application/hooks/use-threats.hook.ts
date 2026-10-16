import { useCallback } from "react";
import { ThreatsActions } from "#application/actions/threats.actions.ts";
import { threatsSelectors } from "#application/selectors/threats.selectors.ts";
import { useAppDispatch, useAppSelector } from "./use-app-redux.hook";

/**
 * A project's threats, flattened from its generic threats and sorted by name. They live in the
 * store, so every instance shares them, and loads started together share one request.
 */
export const useThreats = ({ projectId }: { projectId: number }) => {
    const dispatch = useAppDispatch();
    const items = useAppSelector((state) => threatsSelectors.selectByProjectId(state, projectId));
    const isPending = useAppSelector((state) => state.threats.isPending);

    const loadThreats = useCallback(async () => {
        await dispatch(ThreatsActions.getThreats({ projectId }));
    }, [projectId, dispatch]);

    return {
        items,
        isPending,
        loadThreats,
    };
};
