import type { ConnectionAnchor } from "#api/types/system.types.ts";
import { STANDARD_COMPONENT_TYPES } from "#api/types/standard-component.types.ts";

type ConnectionEndpoint = Pick<ConnectionAnchor, "type" | "communicationInterfaceId">;

export type ValidateConnectionResult = { ok: true } | { ok: false; messageKey: string };

export const isSystemOrCustomComponent = (type: ConnectionEndpoint["type"]): boolean => {
    return (
        [STANDARD_COMPONENT_TYPES.CLIENT, STANDARD_COMPONENT_TYPES.SERVER, STANDARD_COMPONENT_TYPES.DATABASE].includes(
            type as STANDARD_COMPONENT_TYPES
        ) || typeof type === "number"
    );
};

export const validateConnection = (from: ConnectionEndpoint, to: ConnectionEndpoint): ValidateConnectionResult => {
    if (from.type === STANDARD_COMPONENT_TYPES.USERS) {
        if (!isSystemOrCustomComponent(to.type)) {
            return { ok: false, messageKey: "errors.userConnectionInvalid" };
        }
    } else if (to.type === STANDARD_COMPONENT_TYPES.USERS) {
        if (!isSystemOrCustomComponent(from.type)) {
            return { ok: false, messageKey: "errors.componentToUserInvalid" };
        }
    } else if (isSystemOrCustomComponent(from.type)) {
        if (to.type !== STANDARD_COMPONENT_TYPES.COMMUNICATION_INFRASTRUCTURE || !from.communicationInterfaceId) {
            return { ok: false, messageKey: "errors.componentToCommunicationInfraInvalid" };
        }
    } else if (from.type === STANDARD_COMPONENT_TYPES.COMMUNICATION_INFRASTRUCTURE) {
        if (!isSystemOrCustomComponent(to.type) || !to.communicationInterfaceId) {
            return { ok: false, messageKey: "errors.communicationInfraToComponentInvalid" };
        }
    } else {
        return { ok: false, messageKey: "errors.invalidConnection" };
    }

    return { ok: true };
};
