import type { Asset } from "#api/types/asset.types.ts";

const searchableAssetFields = ["name", "description"] as const satisfies readonly (keyof Asset)[];

/** Underscores and spaces are interchangeable, so "web server" also finds "web_server". */
const normalize = (value: string) => value.replace(/_/g, " ").toLowerCase();

/**
 * Matches an asset against a free-text search: its name, its description or its exact id.
 */
export const matchesAssetSearch = (asset: Asset, searchValue: string): boolean => {
    if (searchValue === "") {
        return true;
    }

    const normalizedSearchValue = normalize(searchValue);

    return (
        searchableAssetFields.some((searchableField) =>
            normalize(asset[searchableField]).includes(normalizedSearchValue)
        ) || `${asset.id}` === searchValue
    );
};
