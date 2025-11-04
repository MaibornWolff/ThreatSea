import { useCallback } from "react";
import type { Catalog } from "#api/types/catalogs.types.ts";
import { CatalogsActions } from "../actions/catalogs.actions";
import { catalogsSelector } from "../selectors/catalogs.selector";
import { useAppDispatch, useAppSelector } from "./use-app-redux.hook";

export const useCatalogs = () => {
    const dispatch = useAppDispatch();

    const items = useAppSelector(catalogsSelector.selectAll);
    const isPending = useAppSelector((state) => state.catalogs.isPending);

    const loadCatalogs = useCallback(() => {
        dispatch(CatalogsActions.getCatalogs());
    }, [dispatch]);

    const deleteCatalog = (data: Catalog) => {
        dispatch(CatalogsActions.deleteCatalog(data));
    };

    return {
        items,
        isPending,
        loadCatalogs,
        deleteCatalog,
    };
};
