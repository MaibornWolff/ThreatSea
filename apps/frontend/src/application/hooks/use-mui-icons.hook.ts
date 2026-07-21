/**
 * Lazy access to the generated MUI icon path data (see generate-mui-icon-paths.mjs),
 * rendering icons by name without bundling @mui/icons-material's per-icon components.
 * base + outlined are the searchable picker maps; variants loads only on a miss in both.
 */
import { useEffect, useState } from "react";

export type IconDefinition = string | [tagName: string, attributes: Record<string, string>][];
type IconMap = Record<string, IconDefinition>;
type IconMapKind = "base" | "outlined" | "variants";

const OUTLINED_SUFFIX = "Outlined";

const loadedIconMaps: Partial<Record<IconMapKind, IconMap>> = {};
const iconMapPromises: Partial<Record<IconMapKind, Promise<IconMap>>> = {};

const importIconMapModule = (kind: IconMapKind) => {
    if (kind === "base") {
        return import("#generated/mui-icon-paths.base.js");
    }
    if (kind === "outlined") {
        return import("#generated/mui-icon-paths.outlined.js");
    }
    return import("#generated/mui-icon-paths.variants.js");
};

const loadIconMap = (kind: IconMapKind): Promise<IconMap> => {
    iconMapPromises[kind] ??= importIconMapModule(kind)
        .then((module) => (loadedIconMaps[kind] = module.default))
        .catch((error: unknown) => {
            // Drop the rejected promise so a later render can retry (chunk loads fail transiently, e.g. post-deploy).
            delete iconMapPromises[kind];
            throw error;
        });
    return iconMapPromises[kind];
};

// Only "Outlined" has its own chunk; Rounded/Sharp/TwoTone share the variants chunk.
const variantMapKindForName = (iconName: string): IconMapKind =>
    iconName.endsWith(OUTLINED_SUFFIX) ? "outlined" : "variants";

const lookupLoadedDefinition = (iconName: string): IconDefinition | undefined =>
    loadedIconMaps.base?.[iconName] ?? loadedIconMaps.outlined?.[iconName] ?? loadedIconMaps.variants?.[iconName];

export const useMuiIconDefinition = (iconName: string): IconDefinition | undefined => {
    const [definition, setDefinition] = useState<IconDefinition | undefined>(() => lookupLoadedDefinition(iconName));

    useEffect(() => {
        if (!iconName) {
            setDefinition(undefined);
            return;
        }
        let cancelled = false;
        const resolveDefinition = async () => {
            try {
                const baseIconMap = await loadIconMap("base");
                let resolved = baseIconMap[iconName];
                resolved ??= (await loadIconMap(variantMapKindForName(iconName)))[iconName];
                if (!cancelled) {
                    setDefinition(resolved);
                }
            } catch (error) {
                // Leave it blank; the next mount retries.
                console.error("Failed to load MUI icon data", error);
            }
        };
        void resolveDefinition();
        return () => {
            cancelled = true;
        };
    }, [iconName]);

    return definition;
};

/**
 * Base (filled) plus outlined icon names, for search/filtering in icon pickers.
 * Returns an empty list until both maps have loaded.
 */
export const useMuiIconNames = (): readonly string[] => {
    const [iconNames, setIconNames] = useState<readonly string[]>(() =>
        loadedIconMaps.base && loadedIconMaps.outlined
            ? [...Object.keys(loadedIconMaps.base), ...Object.keys(loadedIconMaps.outlined)]
            : []
    );

    useEffect(() => {
        if (iconNames.length > 0) {
            return;
        }
        let cancelled = false;
        void Promise.all([loadIconMap("base"), loadIconMap("outlined")])
            .then(([baseIconMap, outlinedIconMap]) => {
                if (!cancelled) {
                    setIconNames([...Object.keys(baseIconMap), ...Object.keys(outlinedIconMap)]);
                }
            })
            .catch((error: unknown) => {
                // Leave it empty; the next mount retries.
                console.error("Failed to load MUI icon data", error);
            });
        return () => {
            cancelled = true;
        };
    }, [iconNames.length]);

    return iconNames;
};
