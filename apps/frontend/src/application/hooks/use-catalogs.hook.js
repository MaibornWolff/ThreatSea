/**
 * @module use-catalogs.hook - Custom hook
 *     for the catalogues.
 */

import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CatalogsActions } from "../actions/catalogs.actions";
import { catalogsSelector } from "../selectors/catalogs.selector";

/**
 * Creates a custom hook for the catalogues.
 * @returns Catalogues hook.
 */
export const useCatalogs = () => {
    const dispatch = useDispatch();

    // Items is an array of catalogues and pending
    // a flag that indcates if an api request is still pending.
    const items = useSelector(catalogsSelector.selectAll);
    const isPending = useSelector((state) => state.catalogs.isPending);

    /**
     * Loads the catalogs of threatsea.
     * Always when the page renders the first time.
     */
    const loadCatalogs = useCallback(() => {
        dispatch(CatalogsActions.getCatalogs());
    }, [dispatch]);

    /**
     * Deletes the specified catalogue.
     * @param {object} data - Data of the catalogue.
     */
    const deleteCatalog = (data) => {
        dispatch(CatalogsActions.deleteCatalog(data));
    };

    return {
        items,
        isPending,
        loadCatalogs,
        deleteCatalog,
    };
};
