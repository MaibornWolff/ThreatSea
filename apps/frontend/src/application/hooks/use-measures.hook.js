import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MeasuresActions } from "../actions/measures.actions";
import measuresSelectors from "../selectors/measures.selectors";

/**
 * the useMeasures hook can be used to load, create, delete or modify measures.
 * @module useMeasures
 * @category Hooks
 */
export const useMeasures = ({ projectId }) => {
    const dispatch = useDispatch();

    const items = useSelector((state) => measuresSelectors.selectByProjectId(state, projectId));
    const isPending = useSelector((state) => state.measures.isPending);

    const loadMeasures = useCallback(() => {
        dispatch(MeasuresActions.getMeasures({ projectId }));
    }, [projectId, dispatch]);

    const deleteMeasure = (data) => {
        dispatch(MeasuresActions.deleteMeasure({ ...data, projectId }));
    };

    const measures = useMemo(
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
        /**
         * list of measures
         * @member {Array} measures
         */
        items: measures,
        isPending,
        /**
         * load measures from API
         * @function setSortDirection
         */
        loadMeasures,
        deleteMeasure,
    };
};
