import { STANDARD_COMPONENT_TYPES, type StandardIcon } from "#api/types/standard-component.types.ts";
import communicationInfrastructureImg from "#images/communication-infrastructure.png";
import databaseImg from "#images/database.png";
import desktopImg from "#images/desktop.png";
import serverImg from "#images/server.png";
import userImg from "#images/user.png";

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
