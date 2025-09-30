/**
 * @module asset-events.sockets - Defines the events
 *     of the assets for the socket.
 */
import { Socket } from "socket.io";
import { Asset, CreateAsset } from "#db/schema.js";
import { executeActionIfRoleGrantsAccess } from "#sockets/user-events.sockets.js";
import { SocketUser } from "#sockets/events.sockets.js";
import { USER_ROLES } from "#types/user-roles.types.js";

/**
 * Initializes the socket events for the assets page.
 *
 * @param {Socket} socket - socket.io socket.
 */
export function initAssetEvents(socket: Socket, user: SocketUser) {
    /**
     * Event handler when an asset is created.
     *
     * Emits to the current project room.
     *
     * @param {NewAsset} asset - asset to be created
     */
    socket.on("set_asset", (asset: CreateAsset) => {
        if (user.projectId === undefined || user.projectId !== asset.projectId) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.to(user.projectId!.toString()).emit("set_asset", asset);
            },
            "project",
            USER_ROLES.EDITOR,
            user
        );
    });

    /**
     * Event handler when an asset is removed.
     *
     * Emits to the current project room.
     *
     * @param {Asset} asset - asset to be removed
     */
    socket.on("remove_asset", (asset: Asset) => {
        if (user.projectId === undefined || user.projectId !== asset.projectId) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.to(user.projectId!.toString()).emit("remove_asset", asset);
            },
            "project",
            USER_ROLES.EDITOR,
            user
        );
    });
}
