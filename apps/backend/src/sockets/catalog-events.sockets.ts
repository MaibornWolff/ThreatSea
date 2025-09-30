/**
 * @module catalog.sockets - Defines the socket
 *     events for the catalog.
 */
import { Socket } from "socket.io";
import { Logger } from "#logging/index.js";
import { CatalogMeasure, CatalogThreat, CreateCatalogMeasure, CreateCatalogThreat } from "#db/schema.js";
import {
    executeActionIfRoleGrantsAccess,
    INVALID_PROJECT_CATALOG_ID,
    userStore,
} from "#sockets/user-events.sockets.js";
import { SocketUser } from "#sockets/events.sockets.js";
import { USER_ROLES } from "#types/user-roles.types.js";

/**
 * Initializes the socket events for a catalog.
 *
 * @param {Socket} socket - socket.io socket.
 */
export function initCatalogEvents(socket: Socket, user: SocketUser) {
    /**
     * Event handler when a user opens a catalogue.
     *
     * Adds the clients socket to another room.
     *
     * @param {object} catalogData - JSON Object string with the catalogue id.
     */
    socket.on("change_catalog", async (catalogData: { catalogId: number }) => {
        const { catalogId, id } = user;
        const userData = userStore.getUserData(id);

        // Switch the socket to another catalogue room.
        if (catalogId !== catalogData.catalogId) {
            socket.leave(`catalog_${catalogId}`);

            user.catalogId = catalogData.catalogId;

            socket.join(`catalog_${catalogData.catalogId}`);

            Logger.debug("user " + userData?.name + " changed to catalog " + catalogId);
        }
    });

    /**
     * Event handler when a user leaves a catalogue.
     *
     * Adds the clients socket to another room.
     */
    socket.on("leave_catalog", () => {
        const { catalogId, id } = user;
        const userData = userStore.getUserData(id);

        if (catalogId !== INVALID_PROJECT_CATALOG_ID) {
            socket.leave(`catalog_${catalogId}`);

            Logger.debug("user " + userData?.name + " left catalog " + catalogId);

            user.catalogId = INVALID_PROJECT_CATALOG_ID;
        }
    });

    /**
     * Event handler when a catalogue threat is created.
     *
     * Emits to the current catalogue with it's new threat data.
     *
     * @param {NewCatalogThreat} catalogThreat - catalog threat that has been created
     */
    socket.on("set_catalog_threat", (catalogThreat: CreateCatalogThreat) => {
        if (user.catalogId === undefined || user.catalogId !== catalogThreat.catalogId) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.to("catalog_" + catalogThreat.catalogId.toString()).emit("set_catalog_threat", catalogThreat);
            },
            "catalog",
            USER_ROLES.EDITOR,
            user
        );
    });

    /**
     * Event handler when a catalogue threat is removed from the catalogue.
     *
     * Emits to the current catalogue with the data of the removed threat.
     *
     * @param {CatalogThreat} catalogThreat - catalog threat that has been removed
     */
    socket.on("remove_catalog_threat", (catalogThreat: CatalogThreat) => {
        if (user.catalogId === undefined || user.catalogId !== catalogThreat.catalogId) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.to("catalog_" + catalogThreat.catalogId.toString()).emit("remove_catalog_threat", catalogThreat);
            },
            "catalog",
            USER_ROLES.EDITOR,
            user
        );
    });

    /**
     * Event handler when a catalogue measure is added to the catalogue.
     *
     * Emits to the current catalogue room.
     *
     * @param {NewCatalogMeasure} catalogMeasure - catalog measure that has been added
     */
    socket.on("set_catalog_measure", (catalogMeasure: CreateCatalogMeasure) => {
        if (user.catalogId === undefined || user.catalogId !== catalogMeasure.catalogId) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.to("catalog_" + catalogMeasure.catalogId.toString()).emit("set_catalog_measure", catalogMeasure);
            },
            "catalog",
            USER_ROLES.EDITOR,
            user
        );
    });

    /**
     * Event handler when a catalogue measure is removed from the catalogue.
     *
     * Emits to the current catalogue room.
     *
     * @param {CatalogMeasure} catalogMeasure - catalog measure that has been removed
     */
    socket.on("remove_catalog_measure", (catalogMeasure: CatalogMeasure) => {
        if (user.catalogId === undefined || user.catalogId !== catalogMeasure.catalogId) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket
                    .to("catalog_" + catalogMeasure.catalogId.toString())
                    .emit("remove_catalog_measure", catalogMeasure);
            },
            "catalog",
            USER_ROLES.EDITOR,
            user
        );
    });
}
