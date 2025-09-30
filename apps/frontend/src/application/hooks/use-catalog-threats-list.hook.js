/**
 * @module use-catalog-threat-list.hook - Custom hook
 *     for the catalogue threat list.
 */

import { useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { socket } from "../../api/system-socket.api";
import { CatalogThreatsActions } from "../actions/catalog-threats.actions";
import { useCatalogThreats } from "./use-catalog-threats.hook";
import { useList } from "./use-list.hooks";

/**
 * Creates a custom hook for the catalogue threat list.
 *
 * @param {number} catalogId - id of the catalogue.
 * @param {string} attacker - Type of the attacker.
 * @param {string} pointOfAttack - Type of the attack point.
 * @param {string} sortBy - Attribute to sort by.
 * @param {string} sortDirection - Sorting order.
 * @param {string} searchValue - Filtered value.
 * @returns Catalogue threat list.
 */
export const useCatalogThreatsList = ({ catalogId, attacker, pointOfAttack, sortBy, sortDirection, searchValue }) => {
    const dispatch = useDispatch();
    const { setSortDirection, setSearchValue, setSortBy } = useList("catalogThreats");

    const { isPending, items, loadCatalogThreats, deleteCatalogThreat } = useCatalogThreats({
        catalogId,
    });

    /**
     * Loads the threats whenever they change.
     */
    useEffect(() => {
        loadCatalogThreats();
    }, [loadCatalogThreats]);

    /**
     * Notifies others when a user leaves the catalogue.
     */
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
     * Filters the threats by the attackers, point of attack and
     * the given search query.
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

    /**
     * Sets eventhandlers on the users socket to
     * dispatch actions when they remove or change/create a catalogue.
     */
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
