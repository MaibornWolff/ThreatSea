import { useEffect, useMemo } from "react";
import type { CatalogThreat } from "#api/types/catalog-threat.types.ts";
import type { ATTACKERS } from "#api/types/attackers.types.ts";
import type { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import type { SortDirection } from "#application/actions/list.actions.ts";
import { socket } from "../../api/system-socket.api";
import { CatalogThreatsActions } from "../actions/catalog-threats.actions";
import { useAppDispatch } from "./use-app-redux.hook";
import { useCatalogThreats } from "./use-catalog-threats.hook";
import { useList } from "./use-list.hooks";

type CatalogThreatSortField = keyof Pick<CatalogThreat, "name" | "createdAt">;

interface UseCatalogThreatsListArgs {
    catalogId: number;
    attacker: ATTACKERS | null;
    pointOfAttack: POINTS_OF_ATTACK | null;
    sortBy: CatalogThreatSortField;
    sortDirection: SortDirection;
    searchValue: string;
}

export const useCatalogThreatsList = ({
    catalogId,
    attacker,
    pointOfAttack,
    sortBy,
    sortDirection,
    searchValue,
}: UseCatalogThreatsListArgs) => {
    const dispatch = useAppDispatch();
    const { setSortDirection, setSearchValue, setSortBy } = useList("catalogThreats");

    const { isPending, items, loadCatalogThreats, deleteCatalogThreat } = useCatalogThreats({
        catalogId,
    });

    useEffect(() => {
        loadCatalogThreats();
    }, [loadCatalogThreats]);

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
        socket.on("set_catalog_threat", (data) => {
            const catalogThreat = JSON.parse(data);
            dispatch(CatalogThreatsActions.setCatalogThreat(catalogThreat));
        });
        socket.on("remove_catalog_threat", (data) => {
            const catalogThreat = JSON.parse(data);
            dispatch(CatalogThreatsActions.removeCatalogThreat(catalogThreat));
        });
    }, [dispatch]);

    return {
        setSortDirection,
        setSearchValue,
        setSortBy,
        deleteCatalogThreat,
        sortDirection,
        searchValue,
        sortBy,
        isPending,
        catalogThreats: sortedItems,
    };
};
