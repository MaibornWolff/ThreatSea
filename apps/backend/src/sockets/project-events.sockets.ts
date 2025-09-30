/**
 * @module project.sockets - Defines the socket
 *     events for the project.
 */
import { Socket } from "socket.io";
import { SocketUser } from "#sockets/events.sockets.js";
import { INVALID_PROJECT_CATALOG_ID, userStore } from "#sockets/user-events.sockets.js";
import { Logger } from "#logging/index.js";

/**
 * Initializes the socket events for a project.
 *
 * @param {Socket} socket - socket.io socket.
 */
export function initProjectEvents(socket: Socket, user: SocketUser) {
    /**
     * Event handler when the client opens a project.
     *
     * @param {object} data - JSON Object that holds the project id.
     */
    socket.on("change_project", (data: { projectId: number }) => {
        const { id } = user;
        let { projectId } = user;
        const userData = userStore.getUserData(id);

        if (projectId !== undefined && projectId !== data.projectId) {
            // removes socket from room.
            socket.leave(projectId.toString());

            // gets new project id and assigns it to the user.
            user.projectId = data.projectId;
            projectId = user.projectId;
            const projectIdStr = data.projectId?.toString();

            // adds the user to the project room.
            socket.join(projectIdStr);

            Logger.debug(`user ${user.name} changed to project ${projectId}`);

            const projectUsers = userStore.getProjectUsers(projectId);

            if (projectUsers !== undefined) {
                const currUserData = {
                    socketId: "",
                    name: "",
                };

                projectUsers.forEach((userSocketIds: Set<string>, userId: number) => {
                    const currUser = userStore.getUserData(userId);

                    userSocketIds.forEach((socketId: string) => {
                        currUserData.socketId = socketId;
                        currUserData.name = currUser?.name ?? "";

                        Logger.debug("sending user ", currUserData.name);
                        socket.emit("user_joined", currUserData);
                    });
                });
            }

            userStore.insertUserIntoProject(projectId, id, socket.id);
            Logger.debug("SOCKET: ", socket.id);

            // emit to this project room that this user joined.
            socket.to(projectIdStr).emit("user_joined", {
                id: socket.id,
                name: userData?.name,
            });
        }
    });

    /**
     * Event handler when the client leaves a project.
     *
     * Takes care of notification when a user leaves a project.
     * Resets the assigned project of the user object.
     */
    socket.on("leave_project", () => {
        if (user.projectId === undefined) {
            return;
        }

        const { projectId, id } = user;
        const userData = userStore.getUserData(id);

        if (projectId !== INVALID_PROJECT_CATALOG_ID) {
            const projectIdStr = projectId.toString();

            userStore.removeUserFromProject(projectId, id, socket.id);

            // emit that the user left to the project room.
            socket.to(projectIdStr).emit("user_left", { id: socket.id });

            socket.leave(projectIdStr);

            Logger.debug("user " + userData?.name + " left project " + projectId);

            user.projectId = INVALID_PROJECT_CATALOG_ID;
        }
    });
}
