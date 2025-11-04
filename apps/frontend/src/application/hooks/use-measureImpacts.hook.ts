import { useCallback } from "react";
import type { MeasureImpact } from "#api/types/measure-impact.types.ts";
import { MeasureImpactsActions } from "../actions/measureImpacts.actions";
import { measureImpactsSelectors } from "../selectors/measureImpacts.selectors";
import { useAppDispatch, useAppSelector } from "./use-app-redux.hook";

export const useMeasureImpacts = ({ projectId }: { projectId: number }) => {
    const dispatch = useAppDispatch();

    const items = useAppSelector(measureImpactsSelectors.selectAll);
    const isPending = useAppSelector((state) => state.measureImpacts.isPending);

    const loadMeasureImpacts = useCallback(() => {
        dispatch(MeasureImpactsActions.getMeasureImpacts({ projectId }));
    }, [projectId, dispatch]);

    const deleteMeasureImpact = (data: MeasureImpact) => {
        dispatch(MeasureImpactsActions.deleteMeasureImpact({ ...data, projectId }));
    };

    return {
        items,
        isPending,
        loadMeasureImpacts,
        deleteMeasureImpact,
    };
};
