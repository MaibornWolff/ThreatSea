/**
 * @module use-catalog-measures-list.hook - Custom hook
 *     for the catalog measures list.
 */

import { useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { socket } from "../../api/system-socket.api";
import { CatalogMeasuresActions } from "../actions/catalog-measures.actions";
import { useCatalogMeasures } from "./use-catalog-measures.hook";
import { useList } from "./use-list.hooks";

/**
 * Creates a custom hook for the catalogue measurtes
 * list.
 *
 * @param {number} catalogId - id of the catalogue.
 * @param {string} attacker - The type of attacker.
 * @param {string} pointOfAttack - The type of the point thats attacked.
 * @param {string} sortBy - Sort criteria.
 * @param {string} sortDirection - asc/desc order as a string.
 * @param {string} searchValue - String of the search bar.
 * @returns Component that represents the catalogues measures list.
 */
export const useCatalogMeasuresList = ({ catalogId, attacker, pointOfAttack, sortBy, sortDirection, searchValue }) => {
    const dispatch = useDispatch();

    // Hook for sorting the list.
    const { setSortDirection, setSearchValue, setSortBy } = useList("catalogMeasures");

    // Hook to fetch the measures.
    const { isPending, items, loadCatalogMeasures, deleteCatalogMeasure } = useCatalogMeasures({ catalogId });

    // effect that reloads measures if the list changes.
    useEffect(() => {
        loadCatalogMeasures();
    }, [loadCatalogMeasures]);

    // Effect to change the catalogue if the id changes or the user leaves.
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

    /**
     * Memoized filtered items.
     *
     * Allows the user to filter the measures by the attacker, point of
     * attack and search string.
     */
    const filteredItems = useMemo(
        () =>
            items
                .filter((item) => attacker === null || attacker === item.attacker)
                .filter((item) => pointOfAttack === null || pointOfAttack === item.pointOfAttack)
                .filter((item) => {
                    const lcSearchValue = searchValue.toLowerCase();
                    return ["name"].some((searchField) => item[searchField].toLowerCase().includes(lcSearchValue));
                }),
        [items, searchValue, attacker, pointOfAttack]
    );

    /**
     * Memoized function that sorts the measures by name or date
     * in ascended or descended direction.
     */
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

    // Effect that adds socket events for removing or setting measures.
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
