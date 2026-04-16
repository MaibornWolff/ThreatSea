/**
 * @module events.sockets - Defines all events
 *     of the sockets.
 */
import jwt, { JwtPayload } from "jsonwebtoken";
import { Socket } from "socket.io";
import { JWT_SECRET, JWT_VERIFY_OPTIONS } from "#config/config.js";
import { isTokenRevoked } from "#services/revoked-tokens.service.js";
import { initAssetEvents } from "#sockets/asset-events.sockets.js";
import { initCatalogEvents } from "#sockets/catalog-events.sockets.js";
import { initCatalogsEvents } from "#sockets/catalogs-events.sockets.js";
import { initComponentTypesEvents } from "#sockets/component-types-events.sockets.js";
import { initEditorEvents } from "#sockets/editor-events.sockets.js";
import { initPointOfAttackEvents } from "#sockets/point-of-attack-events.sockets.js";
import { initProjectEvents } from "#sockets/project-events.sockets.js";
import { initProjectsEvents } from "#sockets/projects-events.sockets.js";
import { initThreatEvents } from "#sockets/threat-events.sockets.js";
import { initUserEvents } from "#sockets/user-events.sockets.js";
import { initMemberEvents } from "#sockets/member-events.sockets.js";

export interface SocketUser {
    id: number;
    name: string;
    projectId?: number;
    catalogId?: number;
}

/**
 * Wrapper function that verifies the jwt token and delegates the
 * initialization to the other module functions.
 *
 * @param {Socket} socket - socket.io socket.
 */
export async function setupSocketEvents(socket: Socket) {
    const accessToken = socket.handshake.auth["token"];

    try {
        const decodedToken = jwt.verify(accessToken, JWT_SECRET, JWT_VERIFY_OPTIONS) as JwtPayload;

        const revoked = await isTokenRevoked(accessToken);
        if (revoked) {
            socket.disconnect(true);
            return;
        }

        const userId = Number(decodedToken["userId"]);
        if (!Number.isInteger(userId) || userId <= 0) {
            socket.disconnect(true);
            return;
        }

        const user: SocketUser = {
            id: userId,
            name: `${decodedToken["firstname"]} ${decodedToken["lastname"]}`,
        };

        initUserEvents(socket, user);
        initProjectEvents(socket, user);
        initCatalogEvents(socket, user);
        initEditorEvents(socket, user);
        initPointOfAttackEvents(socket, user);
        initAssetEvents(socket, user);
        initThreatEvents(socket, user);
        initProjectsEvents(socket, user);
        initCatalogsEvents(socket, user);
        initComponentTypesEvents(socket, user);
        initMemberEvents(socket, user);
    } catch {
        socket.disconnect(true);
    }
}
