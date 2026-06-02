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
