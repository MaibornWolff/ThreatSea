/**
 * @module user-events.sockets - Defines the
 *     event handler functions for the user related controls
 *     of the sockets.
 *     Also keeps track of the sockets user data.
 */
import { and, eq } from "drizzle-orm";
import { Socket } from "socket.io";
import { Logger } from "#logging/index.js";
import { db } from "#db/index.js";
import { usersCatalogs, usersProjects } from "#db/schema.js";
import { SocketUser } from "#sockets/events.sockets.js";
import { USER_ROLES } from "#types/user-roles.types.js";

export const INVALID_PROJECT_CATALOG_ID = -1;

export interface UserData {
    name: string;
    socketAmount: number;
    deletedCatalogs: Set<number>;
    deletedProjects: Set<number>;
    isPrivileged: boolean;
}

export class GrantProjectAccessData {
    projectId: number;

    constructor(projectId: number) {
        this.projectId = projectId;
    }
}

export class GrantCatalogAccessData {
    catalogId: number;

    constructor(catalogId: number) {
        this.catalogId = catalogId;
    }
}

/**
 * Class that maps the socket id to the data of the user.
 */
class UserStore {
    userDataStore: Map<number, UserData>;
    projectUserStore: Map<number, Map<number, Set<string>>>;

    /**
     * Initializes this class with empty maps for both stores.
     */
    constructor() {
        this.userDataStore = new Map();
        this.projectUserStore = new Map();
    }

    /**
     * Fetches the data of the user.
     *
     * @param {number} userId - id of the current user.
     * @returns The user data.
     */
    getUserData(userId: number): UserData | undefined {
        Logger.debug("GET USER: ", JSON.stringify(this.userDataStore));

        return this.userDataStore.get(userId);
    }

    /**
     * Inserts the user data into the user store.
     *
     * @param {number} userId - id of the current user.
     * @param {UserData} userData - object that holds the user data.
     */
    insertUserData(userId: number, userData: UserData) {
        Logger.debug("ID: ", userId.toString());

        if (!this.userDataStore.has(userId)) {
            this.userDataStore.set(userId, userData);
        } else {
            this.userDataStore.get(userId)!.socketAmount++;
        }

        Logger.debug(userId.toString(), JSON.stringify(userData), "INSERT USER: ", JSON.stringify(this.userDataStore));
    }

    /**
     * Deletes the user data from the store.
     *
     * @param {number} userId - id of the current user.
     */
    deleteUserData(userId: number) {
        const userData = this.userDataStore.get(userId);

        --userData!.socketAmount;

        if (userData?.socketAmount === 0) {
            this.userDataStore.delete(userId);
        }

        Logger.debug("DELETE USER: ", JSON.stringify(this.userDataStore));
    }

    /**
     * Gets the users that are currently connected to this project.
     *
     * @param {number} projectId - id of the current project.
     * @returns All members of the specified project.
     */
    getProjectUsers(projectId: number): Map<number, Set<string>> | undefined {
        Logger.debug("GET PROJECT USERS: ", JSON.stringify(this.projectUserStore));

        return this.projectUserStore.get(projectId);
    }

    /**
     * Inserts the user into the given project.
     *
     * @param {number} projectId - id of the current project.
     * @param {number} userId - id of the current user.
     */
    insertUserIntoProject(projectId: number, userId: number, socketId: string) {
        let projectUsers: Map<number, Set<string>>;

        if (this.projectUserStore.has(projectId)) {
            this.projectUserStore.get(projectId)?.get(userId)?.add(socketId);
        } else {
            const socketSet = new Set<string>();

            socketSet.add(socketId);

            projectUsers = new Map<number, Set<string>>();
            projectUsers.set(userId, socketSet);

            this.projectUserStore.set(projectId, projectUsers);
        }

        Logger.debug("INSERT PROJECT USERS: ", JSON.stringify(this.projectUserStore));
    }

    /**
     * Removed a user from this project.
     *
     * @param {number} projectId - id of the project.
     * @param {number} userId - id of the current user.
     */
    removeUserFromProject(projectId: number, userId: number, socketId: string) {
        const projectUsers = this.projectUserStore.get(projectId);
        const userSockets = projectUsers?.get(userId);

        userSockets?.delete(socketId);

        if (userSockets?.size === 0) {
            projectUsers?.delete(userId);
        }
        if (projectUsers?.size === 0) {
            this.projectUserStore.delete(projectId);
        }

        Logger.debug("REMOVE PROJECT USERS: ", JSON.stringify(this.projectUserStore));
    }
}

export const userStore = new UserStore();
Object.freeze(userStore);

/**
 *
 * @param {function} action
 * @param {number} roleNeeded
 */
export async function executeActionIfRoleGrantsAccess(
    action: () => void,
    scope: "project" | "catalog",
    roleNeeded: USER_ROLES,
    socketUser: SocketUser
): Promise<void> {
    let role: USER_ROLES | undefined;

    if (scope === "project" && socketUser.projectId !== undefined) {
        const user = await db.query.usersProjects.findFirst({
            where: and(eq(usersProjects.userId, socketUser.id), eq(usersProjects.projectId, socketUser.projectId)),
        });

        role = user?.role;
    } else if (scope === "catalog" && socketUser.catalogId !== undefined) {
        const user = await db.query.usersCatalogs.findFirst({
            where: and(eq(usersCatalogs.userId, socketUser.id), eq(usersCatalogs.catalogId, socketUser.catalogId)),
        });

        role = user?.role;
    } else {
        Logger.debug("CANT FETCH RIGHTS: ", JSON.stringify({ scope, ...socketUser }));
    }

    if (role !== undefined && role <= roleNeeded) {
        action();
    }
}

/**
 * Initializes the user data of the socket and the events
 * of the user's socket.
 *
 * @param {Socket} socket - socket.io socket.
 */
export function initUserEvents(socket: Socket, user: SocketUser) {
    const userData: UserData = {
        name: user.name,
        socketAmount: 1,
        deletedCatalogs: new Set(),
        deletedProjects: new Set(),
        isPrivileged: user.isPrivileged,
    };

    userStore.insertUserData(user.id, userData);

    Logger.debug("User: ", userData.name);
    Logger.debug("Socket: ", socket.id);

    /**
     * EventHandler for disconnection of the client.
     *
     * Resets the user object inside of the user array.
     * Emits for the assigned project room that the user left.
     */
    socket.on("disconnect", () => {
        const { id, projectId } = user;
        Logger.debug("Bye bye ", socket.id);

        if (projectId !== undefined && projectId > INVALID_PROJECT_CATALOG_ID) {
            socket.to(projectId.toString()).emit("user_left", { id: socket.id });

            userStore.removeUserFromProject(projectId, id, socket.id);
        }
        userStore.deleteUserData(id);
    });
}
