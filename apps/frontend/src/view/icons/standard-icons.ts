import { STANDARD_COMPONENT_TYPES, type StandardIcon } from "#api/types/standard-component.types.ts";
import communicationInfrastructureImg from "#images/communication-infrastructure.png?inline";
import databaseImg from "#images/database.png?inline";
import desktopImg from "#images/desktop.png?inline";
import serverImg from "#images/server.png?inline";
import userImg from "#images/user.png?inline";

export const STANDARD_ICON_IMAGES: Record<STANDARD_COMPONENT_TYPES, string> = {
    [STANDARD_COMPONENT_TYPES.USERS]: userImg,
    [STANDARD_COMPONENT_TYPES.CLIENT]: desktopImg,
    [STANDARD_COMPONENT_TYPES.SERVER]: serverImg,
    [STANDARD_COMPONENT_TYPES.DATABASE]: databaseImg,
    [STANDARD_COMPONENT_TYPES.COMMUNICATION_INFRASTRUCTURE]: communicationInfrastructureImg,
};

// Base filename → component type.
const STANDARD_ICON_FILENAME_TO_TYPE: Record<string, STANDARD_COMPONENT_TYPES> = {
    user: STANDARD_COMPONENT_TYPES.USERS,
    desktop: STANDARD_COMPONENT_TYPES.CLIENT,
    server: STANDARD_COMPONENT_TYPES.SERVER,
    database: STANDARD_COMPONENT_TYPES.DATABASE,
    "communication-infrastructure": STANDARD_COMPONENT_TYPES.COMMUNICATION_INFRASTRUCTURE,
};

const STANDARD_ICON_IMAGE_TO_TYPE = new Map<string, STANDARD_COMPONENT_TYPES>(
    Object.entries(STANDARD_ICON_IMAGES).map(([type, image]) => [image, type as STANDARD_COMPONENT_TYPES])
);

/**
 * Resolves a `symbol` to its standard icon type, or null for a custom image. Handles all stored
 * forms (inline data URL, prod hashed path, dev path) — a direct compare to STANDARD_ICON_IMAGES
 * matches only the data-URL form.
 */
export const standardIconTypeForSymbol = (symbol: string | null | undefined): STANDARD_COMPONENT_TYPES | null => {
    if (!symbol) {
        return null;
    }
    const byDataUrl = STANDARD_ICON_IMAGE_TO_TYPE.get(symbol);
    if (byDataUrl) {
        return byDataUrl;
    }
    // Trailing "/<name>.<hash>.png" asset path.
    const filename = symbol.match(/\/([a-z-]+)(?:\.[a-f0-9]+)?\.png$/i)?.[1]?.toLowerCase();
    return filename ? (STANDARD_ICON_FILENAME_TO_TYPE[filename] ?? null) : null;
};

/** True when the symbol is any of the standard icons, in any stored form. */
export const isStandardIconSymbol = (symbol: string | null | undefined): boolean =>
    standardIconTypeForSymbol(symbol) !== null;

export const SELECTABLE_STANDARD_ICONS: StandardIcon[] = [
    STANDARD_COMPONENT_TYPES.USERS,
    STANDARD_COMPONENT_TYPES.CLIENT,
    STANDARD_COMPONENT_TYPES.SERVER,
    STANDARD_COMPONENT_TYPES.DATABASE,
];

export const STANDARD_ICON_LABEL_KEYS: Record<StandardIcon, string> = {
    [STANDARD_COMPONENT_TYPES.USERS]: "Users",
    [STANDARD_COMPONENT_TYPES.CLIENT]: "Client",
    [STANDARD_COMPONENT_TYPES.SERVER]: "Server",
    [STANDARD_COMPONENT_TYPES.DATABASE]: "Database",
};
