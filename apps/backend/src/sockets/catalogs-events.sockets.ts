/**
 * @module catalogs-events.sockets - Defines the events
 *     of the catalogs for the socket.
 */

import { Socket } from "socket.io";
import { Catalog, CreateCatalog } from "#db/schema.js";
import { SocketUser } from "#sockets/events.sockets.js";
import { executeActionIfRoleGrantsAccess, userStore } from "#sockets/user-events.sockets.js";
import { USER_ROLES } from "#types/user-roles.types.js";

/**
 * Initializes the socket events and rooms for the catalogs page.
 *
 * @param {Socket} socket - socket.io socket.
 */
export function initCatalogsEvents(socket: Socket, user: SocketUser) {
    socket.join("catalogspage");

    socket.on("create_catalog", (catalog: CreateCatalog) => {
        socket.to("catalogspage").emit("set_catalog", catalog);
    });

    /**
     * Event handler when a catalogue is created/changed.
     *
     * Emits to the catalogue page.
     *
     * @param {Catalog} catalog - catalog that has been created/updated
     */
    socket.on("update_catalog", (catalog: Catalog) => {
        if (user.catalogId === undefined || user.catalogId !== catalog.id) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.to("catalogspage").emit("set_catalog", catalog);
            },
            "catalog",
            USER_ROLES.OWNER,
            user
        );
    });

    /**
     * Event handler when a catalogue is removed.
     *
     * Emits to the catalogue page.
     *
     * @param {Catalog} catalog - catalog to be removed
     */
    socket.on("remove_catalog", (catalog: Catalog) => {
        const userData = userStore.getUserData(user.id);

        if (userData?.deletedCatalogs?.has(catalog.id)) {
            userData.deletedCatalogs.delete(catalog.id);
            socket.to("catalogspage").emit("remove_catalog", catalog);
        }
    });
}
