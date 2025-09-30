/**
 * @module member-events.sockets - Defines the socket events for the
 *     member operations.
 */
import { Socket } from "socket.io";
import { Logger } from "#logging/index.js";
import {
    addCatalogAddableMember,
    addProjectAddableMember,
    removeCatalogMember,
    removeProjectMember,
} from "#services/members.service.js";
import { SocketUser } from "#sockets/events.sockets.js";
import { executeActionIfRoleGrantsAccess } from "#sockets/user-events.sockets.js";
import { USER_ROLES } from "#types/user-roles.types.js";

interface MemberData {
    projectId?: number;
    catalogId?: number;
    memberId: number;
}

interface AddMemberData extends MemberData {
    role: USER_ROLES;
}

export function initMemberEvents(socket: Socket, user: SocketUser) {
    socket.on("add_member", async (data: AddMemberData) => {
        if (data.projectId !== undefined && data.projectId === user.projectId) {
            await executeActionIfRoleGrantsAccess(
                async () => {
                    await addProjectAddableMember(data.projectId!, data.memberId, data.role);
                },
                "project",
                USER_ROLES.OWNER,
                user
            );
        } else if (data.catalogId !== undefined && data.catalogId === user.catalogId) {
            await executeActionIfRoleGrantsAccess(
                async () => {
                    await addCatalogAddableMember(data.catalogId!, data.memberId, data.role);
                },
                "catalog",
                USER_ROLES.OWNER,
                user
            );
        }
    });

    socket.on("edit_member", (data: MemberData, role: number) => {
        Logger.debug("Edit member stuff ", JSON.stringify(data), role.toString());
    });

    socket.on("delete_member", async (data: MemberData, success: () => void) => {
        if (data.projectId !== undefined && data.projectId === user.projectId) {
            await executeActionIfRoleGrantsAccess(
                async () => {
                    await removeProjectMember(data.projectId!, data.memberId);
                    socket.to(data.projectId!.toString()).emit("delete_member", data.memberId);

                    success();
                },
                "project",
                USER_ROLES.OWNER,
                user
            );
        } else if (data.catalogId !== undefined && data.catalogId === user.catalogId) {
            await executeActionIfRoleGrantsAccess(
                async () => {
                    await removeCatalogMember(data.catalogId!, data.memberId);
                    socket.to(data.catalogId!.toString()).emit("delete_member", data.memberId);

                    success();
                },
                "catalog",
                USER_ROLES.OWNER,
                user
            );
        }
    });
}
