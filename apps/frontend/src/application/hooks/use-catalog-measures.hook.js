/**
 * @module use-catalog-measures.hook - Custom hook
 *     for the catalog measures.
 */

import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CatalogMeasuresActions } from "../actions/catalog-measures.actions";
import catalogMeasuresSelectors from "../selectors/catalog-measures.selectors";

/**
 * Creates a hook to the specified catalogue data.
 *
 * @param {number} catalogId - id of the catalog.
 * @returns Catalogue measures hook.
 */
export const useCatalogMeasures = ({ catalogId }) => {
    const dispatch = useDispatch();

    // Gets all measures.
    const items = useSelector(catalogMeasuresSelectors.selectAll);

    // Tells us if a request to the server is still going.
    const isPending = useSelector((state) => state.catalogMeasures.isPending);

    /**
     * Dispatches the catalogue measures action to load
     * measures. Cached with useCallback.
     */
    const loadCatalogMeasures = useCallback(() => {
        dispatch(CatalogMeasuresActions.getCatalogMeasures({ catalogId }));
    }, [catalogId, dispatch]);

    /**
     * Dispatches the action to delete the catalogue measure.
     *
     * @param {Object} data - Data of the measure.
     */
    const deleteCatalogMeasure = (data) => {
        dispatch(CatalogMeasuresActions.deleteCatalogMeasure(data));
    };

    return {
        items,
        isPending,
        loadCatalogMeasures,
        deleteCatalogMeasure,
    };
};
