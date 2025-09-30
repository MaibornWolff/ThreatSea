/**
 * @module threat-events.sockets - Defines the events
 *     for the project threats of the socket.
 */
import { Socket } from "socket.io";
import { Threat } from "#db/schema.js";
import { SocketUser } from "#sockets/events.sockets.js";
import { executeActionIfRoleGrantsAccess } from "#sockets/user-events.sockets.js";
import { USER_ROLES } from "#types/user-roles.types.js";

/**
 * Initializes the socket events for the threats page.
 *
 * @param {Socket} socket - socket.io socket.
 */
export function initThreatEvents(socket: Socket, user: SocketUser) {
    /**
     * Event handler when a threat is changed in the threat view of the project.
     *
     * Emits to the current project room.
     *
     * @param {Threat} threat - threat that has been changed
     */
    socket.on("set_threat", (threat: Threat) => {
        if (user.projectId === undefined || user.projectId !== threat.projectId) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                console.log("set_threat to ", user.projectId?.toString());

                socket.to(user.projectId!.toString()).emit("set_threat", threat);
            },
            "project",
            USER_ROLES.EDITOR,
            user
        );
    });

    /**
     * Event handler when a threat is removed in the threat view of the project.
     *
     * Emits to the current project room.
     *
     * @param {Threat} threat - threat that has been removed
     */
    socket.on("remove_threat", (threat: Threat) => {
        if (user.projectId === undefined || user.projectId !== threat.projectId) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.to(user.projectId!.toString()).emit("remove_threat", threat);
            },
            "project",
            USER_ROLES.EDITOR,
            user
        );
    });
}
