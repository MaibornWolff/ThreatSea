/**
 * @module projects-events.sockets - Defines the events
 *     for the projects page.
 */
import { Socket } from "socket.io";
import { CreateProject, Project } from "#db/schema.js";
import { SocketUser } from "#sockets/events.sockets.js";
import { executeActionIfRoleGrantsAccess, userStore } from "#sockets/user-events.sockets.js";
import { USER_ROLES } from "#types/user-roles.types.js";

/**
 * Initializes the socket events for the projects page.
 *
 * @param {Socket} socket - socket.io socket.
 */
export function initProjectsEvents(socket: Socket, user: SocketUser) {
    socket.join("projectspage");

    socket.on("create_project", (_projectData: CreateProject) => {
        //const userData = userStore.getUserData(user.id);
    });

    /**
     * Event handler when a project is created/changed.
     *
     * Emits to the project page.
     *
     * @param {Project} project - project to be updated
     */
    socket.on("update_project", (projectData: Project) => {
        if (user.projectId === undefined || user.projectId !== projectData.id) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.to("projectspage").emit("set_project", projectData);
            },
            "project",
            USER_ROLES.OWNER,
            user
        );
    });

    /**
     * Event handler when a project is removed.
     *
     * Emits to the project page.
     *
     * @param {Project} project - project to be removed
     */
    socket.on("remove_project", (project: Project) => {
        const userData = userStore.getUserData(user.id);

        if (userData?.deletedProjects.has(project.id)) {
            userData.deletedProjects.delete(project.id);

            console.log("Deleting project: ", project);

            socket.to("projectspage").emit("remove_project", project);
        }
    });
}
