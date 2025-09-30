/**
 * @module point-of-attack-events.sockets - Defines the events
 *     of the points of attack for the sockets.
 */
import { Socket } from "socket.io";
import { PointOfAttack } from "#types/system.types.js";
import { SocketUser } from "#sockets/events.sockets.js";
import { executeActionIfRoleGrantsAccess } from "#sockets/user-events.sockets.js";
import { USER_ROLES } from "#types/user-roles.types.js";

/**
 * Initializes the socket events for the points of attack.
 *
 * @param {Socket} socket - socket.io socket.
 */
export function initPointOfAttackEvents(socket: Socket, user: SocketUser) {
    /**
     * Event handler when an attack point is created through the
     * system view.
     *
     * Emits to the current project room.
     *
     * @param {PointOfAttack} pointOfAttack - point of attack that has been created
     */
    socket.on("create_point_of_attack", (pointOfAttack: PointOfAttack) => {
        if (user.projectId === undefined || user.projectId !== pointOfAttack.projectId) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.to(pointOfAttack.projectId.toString()).emit("create_point_of_attack", pointOfAttack);
            },
            "project",
            USER_ROLES.EDITOR,
            user
        );
    });

    /**
     * Event handler when an attack point is changed through the
     * system view.
     *
     * Emits to the current project room.
     *
     * @param {object} data - JSON Object that holds the data
     *     of the attack point and it's assets.
     */
    socket.on("set_point_of_attack", (data: { id: string; assets: number[] }) => {
        if (user.projectId === undefined) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.to(user.projectId!.toString()).emit("set_point_of_attack", data);
            },
            "project",
            USER_ROLES.EDITOR,
            user
        );
    });

    /**
     * Event handler when an attack point is removed from the
     * system view.
     *
     * Emits to the current project room.
     *
     * @param {object} data - JSON Object that holds the
     *     attack point id.
     */
    socket.on("remove_point_of_attack", (data: { id: string }) => {
        if (user.projectId === undefined) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.to(user.projectId!.toString()).emit("remove_point_of_attack", data);
            },
            "project",
            USER_ROLES.EDITOR,
            user
        );
    });
}
