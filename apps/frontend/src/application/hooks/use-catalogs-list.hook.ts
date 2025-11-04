import { useEffect, useMemo } from "react";
import type { CatalogWithRole } from "#api/types/catalogs.types.ts";
import { socket } from "../../api/system-socket.api";
import { CatalogsActions } from "../actions/catalogs.actions";
import { useAppDispatch } from "./use-app-redux.hook";
import { useCatalogs } from "./use-catalogs.hook";
import { useList } from "./use-list.hooks";

const sortableCatalogFields: (keyof Pick<CatalogWithRole, "name" | "createdAt">)[] = ["name", "createdAt"];
type CatalogSortField = (typeof sortableCatalogFields)[number];

export const useCatalogsList = () => {
    const dispatch = useAppDispatch();
    const { isPending, items, loadCatalogs } = useCatalogs();
    const { setSortDirection, setSearchValue, setSortBy, sortDirection, searchValue, sortBy } = useList("catalogs");

    useEffect(() => {
        loadCatalogs();
    }, [loadCatalogs]);

    const filteredItems = useMemo(
        () =>
            items.filter((item) => {
                const lcSearchValue = searchValue.toLowerCase();
                return item.name.toLowerCase().includes(lcSearchValue);
            }),
        [items, searchValue]
    );

    const sortedItems = useMemo(() => {
        const sortField: CatalogSortField = sortableCatalogFields.includes(sortBy as CatalogSortField)
            ? (sortBy as CatalogSortField)
            : "name";

        return filteredItems.sort((a, b) => {
            if (sortDirection === "asc") {
                if (sortField == "name") {
                    return a[sortField].toLowerCase() < b[sortField].toLowerCase() ? -1 : 1;
                } else {
                    return new Date(a[sortField]) < new Date(b[sortField]) ? -1 : 1;
                }
            } else {
                if (sortField == "name") {
                    return a[sortField].toLowerCase() > b[sortField].toLowerCase() ? -1 : 1;
                } else {
                    return new Date(a[sortField]) > new Date(b[sortField]) ? -1 : 1;
                }
            }
        });
    }, [filteredItems, sortBy, sortDirection]);

    useEffect(() => {
        socket.on("set_catalog", (data) => {
            const catalog = JSON.parse(data);
            dispatch(CatalogsActions.setCatalog(catalog));
        });
        socket.on("remove_catalog", (data) => {
            const catalog = JSON.parse(data);
            dispatch(CatalogsActions.removeCatalog(catalog));
        });
    }, [dispatch]);

    return {
        setSortDirection,
        setSearchValue,
        setSortBy,
        sortDirection,
        searchValue,
        sortBy,
        isPending,
        catalogs: sortedItems,
    };
};
