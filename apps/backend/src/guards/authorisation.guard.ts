import { NextFunction, Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "#db/index.js";
import { usersCatalogs, usersProjects } from "#db/schema.js";
import { checkFolderExistsForUser } from "#services/folders.service.js";
import { ForbiddenError } from "#errors/forbidden.error.js";
import { NotFoundError } from "#errors/not-found.error.js";
import { CatalogIdParam } from "#types/catalog.types.js";
import { FolderIdParam } from "#types/folder.types.js";
import { ProjectIdParam } from "#types/project.types.js";
import { UnauthorizedError } from "#errors/unauthorized.error.js";
import { USER_ROLES } from "#types/user-roles.types.js";

/**
 * Middleware function that checks if the user has the required role on a catalog.
 *
 * @param requiredRole - The role that the user must have to perform the action.
 */
export function CheckCatalogRoleHandler<P extends CatalogIdParam>(requiredRole: USER_ROLES) {
    return async function (request: Request<P>, _response: Response, next: NextFunction): Promise<void> {
        const userId = request.user?.id;
        if (!userId) {
            next(new UnauthorizedError());
            return;
        }

        const catalogId = request.params.catalogId;

        const user = await db.query.usersCatalogs.findFirst({
            where: and(eq(usersCatalogs.userId, userId), eq(usersCatalogs.catalogId, catalogId)),
        });

        if (user === undefined) {
            next(new ForbiddenError("User is not a member of this catalog"));
            return;
        }

        if (!checkRole(user.role, requiredRole)) {
            next(new ForbiddenError("User is not authorized to perform this action"));
            return;
        }

        next();
    };
}

/**
 * Middleware function that checks if the user has the required role on a project.
 *
 * @param requiredRole - The role that the user must have to perform the action.
 * @constructor
 */
export function CheckProjectRoleHandler<P extends ProjectIdParam>(requiredRole: USER_ROLES) {
    return async function (request: Request<P>, _response: Response, next: NextFunction) {
        const userId = request.user?.id;
        if (!userId) {
            next(new UnauthorizedError());
            return;
        }

        const projectId = request.params.projectId;

        const user = await db.query.usersProjects.findFirst({
            where: and(eq(usersProjects.userId, userId), eq(usersProjects.projectId, projectId)),
        });

        if (user === undefined) {
            next(new ForbiddenError("User is not a member of this project"));
            return;
        }

        if (!checkRole(user.role, requiredRole)) {
            next(new ForbiddenError("User is not authorized to perform this action"));
            return;
        }

        next();
    };
}

/**
 * Middleware function that checks that a folder exists and belongs to the requesting user.
 * Folders are per-user, so ownership is the only authorization concept. A non-owner gets a
 * 404 (rather than 403) so folder existence is not leaked across users.
 */
export function CheckFolderOwnershipHandler() {
    return async function (request: Request<FolderIdParam>, _response: Response, next: NextFunction): Promise<void> {
        const userId = request.user?.id;
        if (!userId) {
            next(new UnauthorizedError());
            return;
        }

        const owned = await checkFolderExistsForUser(request.params.folderId, userId);
        if (!owned) {
            next(new NotFoundError("Folder not found"));
            return;
        }

        next();
    };
}

export function checkRole(userRole: USER_ROLES, requiredRole: USER_ROLES): boolean {
    switch (requiredRole) {
        case USER_ROLES.OWNER:
            return userRole === USER_ROLES.OWNER;
        case USER_ROLES.EDITOR:
            return userRole === USER_ROLES.OWNER || userRole === USER_ROLES.EDITOR;
        case USER_ROLES.VIEWER:
            return userRole === USER_ROLES.OWNER || userRole === USER_ROLES.EDITOR || userRole === USER_ROLES.VIEWER;
        default:
            return false;
    }
}
