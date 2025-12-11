import { useCallback } from "react";
import type { CatalogThreat } from "#api/types/catalog-threat.types.ts";
import { CatalogThreatsActions } from "../actions/catalog-threats.actions";
import { catalogThreatsSelectors } from "../selectors/catalog-threats.selectors";
import { useAppDispatch, useAppSelector } from "./use-app-redux.hook";

export const useCatalogThreats = ({ catalogId }: { catalogId: number }) => {
    const dispatch = useAppDispatch();

    const items = useAppSelector(catalogThreatsSelectors.selectAll);
    const isPending = useAppSelector((state) => state.catalogThreats.isPending);

    const loadCatalogThreats = useCallback(() => {
        dispatch(CatalogThreatsActions.getCatalogThreats({ catalogId }));
    }, [catalogId, dispatch]);

    const deleteCatalogThreat = (data: CatalogThreat) => {
        dispatch(CatalogThreatsActions.deleteCatalogThreat(data));
    };

    return {
        items,
        isPending,
        loadCatalogThreats,
        deleteCatalogThreat,
    };
};
