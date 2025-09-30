import { useEffect, useMemo } from "react";
import { useList } from "./use-list.hooks";
import { useThreats } from "./use-threats.hook";

export const useThreatsList = ({ projectId }) => {
    const { isPending, items, loadThreats, deleteThreat, duplicateThreat } = useThreats({
        projectId,
    });
    const { setSortDirection, setSearchValue, setSortBy, sortDirection, searchValue, sortBy } = useList("threats");

    useEffect(() => {
        loadThreats();
    }, [projectId, loadThreats]);

    const filteredItems = useMemo(
        () =>
            items.filter((item) => {
                const lcSearchValue = searchValue.toLowerCase();
                return (
                    ["name", "description", "componentName", "attacker", "pointOfAttack"].some((searchField) =>
                        item[searchField].replace(/_/g, " ").toLowerCase().includes(lcSearchValue)
                    ) || item.id == searchValue
                );
            }),
        [items, searchValue]
    );

    const transformedItems = useMemo(
        () =>
            filteredItems.map((item) => {
                const { confidentiality, integrity, availability, probability, assets } = item;
                const damage = assets.reduce((value, asset) => {
                    if (confidentiality && value < asset.confidentiality) {
                        value = asset.confidentiality;
                    }
                    if (integrity && value < asset.integrity) {
                        value = asset.integrity;
                    }
                    if (availability && value < asset.availability) {
                        value = asset.availability;
                    }
                    return value;
                }, 0); // default 0 for not affected protection goals
                const risk = probability * damage;
                return {
                    ...item,
                    risk,
                    damage,
                    assets,
                };
            }),
        [filteredItems]
    );

    const sortedItems = useMemo(
        () =>
            transformedItems.sort((a, b) => {
                if (sortDirection === "asc") {
                    return a[sortBy] < b[sortBy] ? -1 : 1;
                } else {
                    return a[sortBy] > b[sortBy] ? -1 : 1;
                }
            }),
        [transformedItems, sortBy, sortDirection]
    );

    return {
        setSortDirection,
        setSearchValue,
        setSortBy,
        deleteThreat,
        duplicateThreat,
        loadThreats,
        sortDirection,
        searchValue,
        sortBy,
        isPending,
        threats: sortedItems,
    };
};
