/**
 * @module use-catalogs-list.hook - Custom hook
 *     for the catalogue list.
 */

import { useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { socket } from "../../api/system-socket.api";
import { CatalogsActions } from "../actions/catalogs.actions";
import { useCatalogs } from "./use-catalogs.hook";
import { useList } from "./use-list.hooks";

/**
 * Creates a custom hook for the catalogue list.
 * @returns Catalogue list hook.
 */
export const useCatalogsList = () => {
    const dispatch = useDispatch();
    const { isPending, items, loadCatalogs } = useCatalogs();
    const { setSortDirection, setSearchValue, setSortBy, sortDirection, searchValue, sortBy } = useList("catalogs");

    /**
     * Loads the catalogues whenever they change.
     */
    useEffect(() => {
        loadCatalogs();
    }, [loadCatalogs]);

    /**
     * Filters the items by the given search value.
     */
    const filteredItems = useMemo(
        () =>
            items.filter((item) => {
                const lcSearchValue = searchValue.toLowerCase();
                return ["name"].some((searchField) => item[searchField].toLowerCase().includes(lcSearchValue));
            }),
        [items, searchValue]
    );

    const sortedItems = useMemo(
        () =>
            filteredItems.sort((a, b) => {
                if (sortDirection === "asc") {
                    if (sortBy == "name") {
                        return a[sortBy].toLowerCase() < b[sortBy].toLowerCase() ? -1 : 1;
                    } else {
                        return new Date(a[sortBy]) < new Date(b[sortBy]) ? -1 : 1;
                    }
                } else {
                    if (sortBy == "name") {
                        return a[sortBy].toLowerCase() > b[sortBy].toLowerCase() ? -1 : 1;
                    } else {
                        return new Date(a[sortBy]) > new Date(b[sortBy]) ? -1 : 1;
                    }
                }
            }),
        [filteredItems, sortBy, sortDirection]
    );

    /**
     * Adds socket eventhandlers for catalogue creation
     * and deletion when the component renders first.
     */
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
