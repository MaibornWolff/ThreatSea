/**
 * @module use-catalog-threat.hook - Custom hook
 *     for the catalogue threats.
 */

import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CatalogThreatsActions } from "../actions/catalog-threats.actions";
import { catalogThreatsSelectors } from "../selectors/catalog-threats.selectors";

/**
 * Creates an custom catalogue threat hook.
 *
 * @param {number} catalogId - id of the current catalogue.
 * @returns Catalogue threat hook.
 */
export const useCatalogThreats = ({ catalogId }) => {
    const dispatch = useDispatch();

    const items = useSelector(catalogThreatsSelectors.selectAll);
    const isPending = useSelector((state) => state.catalogThreats.isPending);

    /**
     * Fetches the catalogue threats when the page loads the
     * first time.
     */
    const loadCatalogThreats = useCallback(() => {
        dispatch(CatalogThreatsActions.getCatalogThreats({ catalogId }));
    }, [catalogId, dispatch]);

    /**
     * Deletes the catalogue threat.
     * @param {object} data - Data of the threat.
     */
    const deleteCatalogThreat = (data) => {
        dispatch(CatalogThreatsActions.deleteCatalogThreat(data));
    };

    return {
        items,
        isPending,
        loadCatalogThreats,
        deleteCatalogThreat,
    };
};
