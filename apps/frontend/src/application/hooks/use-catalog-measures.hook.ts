import { useCallback } from "react";
import type { CatalogMeasure } from "#api/types/catalog-measure.types.ts";
import { CatalogMeasuresActions } from "../actions/catalog-measures.actions";
import { catalogMeasuresSelectors } from "../selectors/catalog-measures.selectors";
import { useAppDispatch, useAppSelector } from "./use-app-redux.hook";

export const useCatalogMeasures = ({ catalogId }: { catalogId: number }) => {
    const dispatch = useAppDispatch();

    const items = useAppSelector(catalogMeasuresSelectors.selectAll);
    const isPending = useAppSelector((state) => state.catalogMeasures.isPending);

    const loadCatalogMeasures = useCallback(() => {
        dispatch(CatalogMeasuresActions.getCatalogMeasures({ catalogId }));
    }, [catalogId, dispatch]);

    const deleteCatalogMeasure = (data: CatalogMeasure) => {
        dispatch(CatalogMeasuresActions.deleteCatalogMeasure(data));
    };

    return {
        items,
        isPending,
        loadCatalogMeasures,
        deleteCatalogMeasure,
    };
};
