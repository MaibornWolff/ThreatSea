import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MeasureImpactsActions } from "../actions/measureImpacts.actions";
import measureImpactsSelectors from "../selectors/measureImpacts.selectors";

/**
 * the useMeasureImpacts hook can be used to load, create, delete or modify measures.
 * @module useMeasureImpacts
 * @category Hooks
 */

export const useMeasureImpacts = ({ projectId }) => {
    const dispatch = useDispatch();

    const items = useSelector(measureImpactsSelectors.selectAll);
    const isPending = useSelector((state) => state.measureImpacts.isPending);

    /**
     * Fetches the measureImpacts when the page is loaded.
     */
    const loadMeasureImpacts = useCallback(() => {
        dispatch(MeasureImpactsActions.getMeasureImpacts({ projectId }));
    }, [projectId, dispatch]);

    /**
     * Deletes the specified measureImpact from the items list.
     * @param {object} measureImpact - Data of the asset.
     */
    const deleteMeasureImpact = (data) => {
        dispatch(MeasureImpactsActions.deleteMeasureImpact({ ...data, projectId }));
    };

    return {
        items,
        isPending,
        loadMeasureImpacts,
        deleteMeasureImpact,
    };
};
