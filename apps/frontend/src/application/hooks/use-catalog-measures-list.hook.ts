import { useEffect, useMemo } from "react";
import type { ATTACKERS } from "#api/types/attackers.types.ts";
import type { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import { socket } from "../../api/system-socket.api";
import { CatalogMeasuresActions } from "../actions/catalog-measures.actions";
import { useAppDispatch } from "./use-app-redux.hook";
import { useCatalogMeasures } from "./use-catalog-measures.hook";
import { useList } from "./use-list.hooks";
import type { SortDirection } from "#application/actions/list.actions.ts";
import type { Catalog } from "#api/types/catalogs.types.ts";

type CatalogMeasureSortField = keyof Pick<Catalog, "name" | "createdAt">;

interface UseCatalogMeasuresListArgs {
    catalogId: number;
    attacker: ATTACKERS | null;
    pointOfAttack: POINTS_OF_ATTACK | null;
    sortBy: CatalogMeasureSortField;
    sortDirection: SortDirection;
    searchValue: string;
}

export const useCatalogMeasuresList = ({
    catalogId,
    attacker,
    pointOfAttack,
    sortBy,
    sortDirection,
    searchValue,
}: UseCatalogMeasuresListArgs) => {
    const dispatch = useAppDispatch();

    const { setSortDirection, setSearchValue, setSortBy } = useList("catalogMeasures");

    const { isPending, items, loadCatalogMeasures, deleteCatalogMeasure } = useCatalogMeasures({ catalogId });

    useEffect(() => {
        loadCatalogMeasures();
    }, [loadCatalogMeasures]);

    useEffect(() => {
        socket.emit(
            "change_catalog",
            JSON.stringify({
                catalogId: catalogId,
            })
        );
        return () => {
            socket.emit("leave_catalog");
        };
    }, [catalogId]);

    const filteredItems = useMemo(
        () =>
            items
                .filter((item) => attacker === null || attacker === item.attacker)
                .filter((item) => pointOfAttack === null || pointOfAttack === item.pointOfAttack)
                .filter((item) => item.name.toLowerCase().includes(searchValue.toLowerCase())),
        [items, searchValue, attacker, pointOfAttack]
    );

    const sortedItems = useMemo(
        () =>
            filteredItems.sort((a, b) => {
                if (sortDirection === "asc") {
                    if (sortBy === "name") {
                        return a[sortBy].toLowerCase() < b[sortBy].toLowerCase() ? -1 : 1;
                    } else {
                        return new Date(a[sortBy]) < new Date(b[sortBy]) ? -1 : 1;
                    }
                } else {
                    if (sortBy === "name") {
                        return a[sortBy].toLowerCase() > b[sortBy].toLowerCase() ? -1 : 1;
                    } else {
                        return new Date(a[sortBy]) > new Date(b[sortBy]) ? -1 : 1;
                    }
                }
            }),
        [filteredItems, sortBy, sortDirection]
    );

    useEffect(() => {
        socket.on("set_catalog_measure", (data) => {
            const catalogMeasure = JSON.parse(data);
            dispatch(CatalogMeasuresActions.setCatalogMeasure(catalogMeasure));
        });

        socket.on("remove_catalog_measure", (data) => {
            const catalogMeasure = JSON.parse(data);
            dispatch(CatalogMeasuresActions.removeCatalogMeasure(catalogMeasure));
        });
    }, [dispatch]);

    return {
        setSortDirection,
        setSearchValue,
        setSortBy,
        deleteCatalogMeasure,
        sortDirection,
        searchValue,
        sortBy,
        isPending,
        catalogMeasures: sortedItems,
    };
};
