import { useCallback, useMemo } from "react";
import type { Measure } from "#api/types/measure.types.ts";
import { MeasuresActions } from "../actions/measures.actions.ts";
import { measuresSelectors } from "../selectors/measures.selectors.ts";
import { useAppDispatch, useAppSelector } from "./use-app-redux.hook.ts";

export const useMeasures = ({ projectId }: { projectId: number }) => {
    const dispatch = useAppDispatch();

    const items = useAppSelector((state) => measuresSelectors.selectByProjectId(state, projectId));
    const isPending = useAppSelector((state) => state.measures.isPending);

    const loadMeasures = useCallback(() => {
        dispatch(MeasuresActions.getMeasures({ projectId }));
    }, [projectId, dispatch]);

    const deleteMeasure = (data: Measure) => {
        dispatch(MeasuresActions.deleteMeasure({ ...data, projectId }));
    };

    const measures: Measure[] = useMemo(
        () =>
            items
                .map((item) => ({
                    ...item,
                    scheduledAt: new Date(item.scheduledAt),
                }))
                .sort((a, b) => (a.scheduledAt > b.scheduledAt ? 1 : -1)),
        [items]
    );

    return {
        items: measures,
        isPending,
        loadMeasures,
        deleteMeasure,
    };
};
