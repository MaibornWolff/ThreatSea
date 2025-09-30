/**
 * @module use-asset-list.hook - Custom hook
 *     for the asset lists.
 */

import { useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { socket } from "../../api/system-socket.api";
import { AssetsActions } from "../actions/assets.actions";
import { useAssets } from "./use-assets.hook";
import { useList } from "./use-list.hooks";

/**
 * Creates a custom hook for the assets list.
 * @param {number} projectId - id of the current project.
 * @returns Asset list hook.
 */
export const useAssetsList = ({ projectId }) => {
    const dispatch = useDispatch();
    const { isPending, items, loadAssets, deleteAsset } = useAssets({
        projectId,
    });
    const { setSortDirection, setSearchValue, setSortBy, sortDirection, searchValue, sortBy } = useList("assets");

    /**
     * Loads assets whenever the project changes
     * or new assets are added.
     */
    useEffect(() => {
        loadAssets({ projectId });
    }, [projectId, loadAssets]);

    /**
     * Emits through the socket api that someone is leaving.
     * Triggers always when the projectId is changing.
     */
    useEffect(() => {
        socket.emit(
            "change_project",
            JSON.stringify({
                projectId: projectId,
            })
        );
        return () => {
            socket.emit("leave_project", JSON.stringify({}));
        };
    }, [projectId]);

    /**
     * Filters the assets by the given search value.
     * Always triggers when the assets or the searchvalue change.
     */
    const filteredItems = useMemo(
        () =>
            items.filter((item) => {
                const lcSearchValue = searchValue.toLowerCase();
                return (
                    ["name", "description"].some((searchField) =>
                        item[searchField].toLowerCase().includes(lcSearchValue)
                    ) || item.id == searchValue
                );
            }),
        [items, searchValue]
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
     * Sets socket event handlers when
     * the asset list is first loaded.
     */
    useEffect(() => {
        socket.on("set_asset", (data) => {
            const asset = JSON.parse(data);
            dispatch(AssetsActions.setAsset(asset));
        });
        socket.on("remove_asset", (data) => {
            const asset = JSON.parse(data);
            dispatch(AssetsActions.removeAsset(asset));
        });
    }, [dispatch]);

    return {
        setSortDirection,
        setSearchValue,
        setSortBy,
        deleteAsset,
        sortDirection,
        searchValue,
        sortBy,
        isPending,
        assets: sortedItems,
    };
};
