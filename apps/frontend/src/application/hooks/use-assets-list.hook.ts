import { useEffect, useMemo } from "react";
import type { Asset } from "#api/types/asset.types.ts";
import { socket } from "../../api/system-socket.api";
import { AssetsActions } from "../actions/assets.actions";
import { useAppDispatch } from "./use-app-redux.hook";
import { useAssets } from "./use-assets.hook";
import { useList } from "./use-list.hooks";

const searchableAssetFields: (keyof Pick<Asset, "name" | "description">)[] = ["name", "description"];
const sortableAssetFields: (keyof Pick<
    Asset,
    "name" | "confidentiality" | "integrity" | "availability" | "createdAt"
>)[] = ["name", "confidentiality", "integrity", "availability", "createdAt"];
type AssetSortField = (typeof sortableAssetFields)[number];

export const useAssetsList = ({ projectId }: { projectId: number }) => {
    const dispatch = useAppDispatch();
    const { isPending, items, loadAssets, deleteAsset } = useAssets({
        projectId,
    });
    const { setSortDirection, setSearchValue, setSortBy, sortDirection, searchValue, sortBy } = useList("assets");

    useEffect(() => {
        loadAssets();
    }, [projectId, loadAssets]);

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

    const filteredItems = useMemo(
        () =>
            items.filter((item: Asset) => {
                const lcSearchValue = searchValue.toLowerCase();
                return (
                    searchableAssetFields.some((searchField) =>
                        item[searchField].toLowerCase().includes(lcSearchValue)
                    ) || `${item.id}` == searchValue
                );
            }),
        [items, searchValue]
    );

    const sortedItems = useMemo(() => {
        const sortField: AssetSortField = sortableAssetFields.includes(sortBy as AssetSortField)
            ? (sortBy as AssetSortField)
            : "name";

        return filteredItems.sort((a, b) => {
            if (sortDirection === "asc") {
                if (sortField === "name") {
                    return a[sortField].toLowerCase() < b[sortField].toLowerCase() ? -1 : 1;
                } else {
                    return new Date(a[sortField]) < new Date(b[sortField]) ? -1 : 1;
                }
            } else {
                if (sortField === "name") {
                    return a[sortField].toLowerCase() > b[sortField].toLowerCase() ? -1 : 1;
                } else {
                    return new Date(a[sortField]) > new Date(b[sortField]) ? -1 : 1;
                }
            }
        });
    }, [filteredItems, sortBy, sortDirection]);

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
