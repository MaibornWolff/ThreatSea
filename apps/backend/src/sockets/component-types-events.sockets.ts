/**
 * @module component-types-events.sockets - Defines
 *     the events for the custom components for the socket.
 */
import { Socket } from "socket.io";
import { ComponentType, CreateComponentType } from "#db/schema.js";
import { executeActionIfRoleGrantsAccess } from "#sockets/user-events.sockets.js";
import { SocketUser } from "./events.sockets.js";
import { USER_ROLES } from "#types/user-roles.types.js";

/**
 * Initializes the socket events for the custom components
 * in the system view.
 *
 * @param {Socket} socket - socket.io socket.
 */
export function initComponentTypesEvents(socket: Socket, user: SocketUser) {
    /**
     * Event handler when a custom component is created.
     *
     * Emits to all connected clients besides the creator
     *
     * @param {CreateComponentType} componentType - component type to be created
     */
    socket.on("create_component_type", (componentType: CreateComponentType) => {
        if (user.projectId === undefined || user.projectId !== componentType.projectId) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.broadcast.emit("create_component_type", componentType);
            },
            "project",
            USER_ROLES.EDITOR,
            user
        );
    });

    /**
     * Event handler when a custom component is changed.
     *
     * Emits to all connected clients besides the creator.
     *
     * @param {ComponentType} componentType - component type that has changed
     */
    socket.on("update_component_type", (componentType: ComponentType) => {
        if (user.projectId === undefined || user.projectId !== componentType.projectId) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.broadcast.emit("update_component_type", componentType);
            },
            "project",
            USER_ROLES.EDITOR,
            user
        );
    });

    /**
     * Event handler when a custom component is deleted.
     *
     * Emits to all connected clients besides the one requesting the deletion.
     *
     * @param {ComponentType} componentType - component type that has been deleted
     */
    socket.on("delete_component_type", (componentType: ComponentType) => {
        if (user.projectId === undefined || user.projectId !== componentType.projectId) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.broadcast.emit("delete_component_type", componentType);
            },
            "project",
            USER_ROLES.EDITOR,
            user
        );
    });
}
