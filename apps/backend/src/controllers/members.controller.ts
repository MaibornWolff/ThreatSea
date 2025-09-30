/**
 * @module members.controller - Defines the controlling function
 *     for the routing of the members.
 */
import { NextFunction, Request, Response } from "express";
import { User } from "#db/schema.js";
import * as MembersService from "#services/members.service.js";
import {
    isCatalogMember,
    isProjectMember,
    removeCatalogMember,
    removeProjectMember,
    UserWithRole,
} from "#services/members.service.js";
import { BadRequestError } from "#errors/bad-request.error.js";
import {
    AddMemberRequest,
    CatalogMemberIdParam,
    MemberResponse,
    ProjectMemberIdParam,
    UpdateMemberRequest,
} from "#types/member.types.js";
import { CatalogIdParam } from "#types/catalog.types.js";
import { ProjectIdParam } from "#types/project.types.js";

/**
 * Gets all members of the specified catalog.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 */
export async function getCatalogAddedMembers(
    request: Request<CatalogIdParam, UserWithRole[], void>,
    response: Response<UserWithRole[]>
): Promise<void> {
    const catalogId = request.params.catalogId;

    const members: MemberResponse[] = await MembersService.getCatalogAddedMembers(catalogId);

    response.json(members);
}

/**
 * Gets all members of the specified project.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 */
export async function getProjectAddedMembers(
    request: Request<ProjectIdParam, UserWithRole[], void>,
    response: Response<UserWithRole[]>
): Promise<void> {
    const projectId = request.params.projectId;

    const members: MemberResponse[] = await MembersService.getProjectAddedMembers(projectId);

    response.json(members);
}

/**
 * Gets all addable users for the specified catalog.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 */
export async function getCatalogAddableMembers(
    request: Request<CatalogIdParam, User[], void>,
    response: Response<User[]>
): Promise<void> {
    const catalogId = request.params.catalogId;

    const addableMembers: User[] = await MembersService.getCatalogAddableMembers(catalogId);

    response.json(addableMembers);
}

/**
 * Gets all addable users for the specified project.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 */
export async function getProjectAddableMembers(
    request: Request<ProjectIdParam, User[], void>,
    response: Response<User[]>
): Promise<void> {
    const projectId = request.params.projectId;

    const addableMembers: User[] = await MembersService.getProjectAddableMembers(projectId);

    response.json(addableMembers);
}

/**
 * Adds a member to the specified catalog.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function addCatalogAddableMember(
    request: Request<CatalogMemberIdParam, void, AddMemberRequest>,
    response: Response<void>,
    next: NextFunction
): Promise<void> {
    const catalogId = request.params.catalogId;
    const memberId = request.params.memberId;

    const isMember = await isCatalogMember(catalogId, memberId);
    if (isMember) {
        next(new BadRequestError("User is already a member of this catalog"));
        return;
    }
    await MembersService.addCatalogAddableMember(catalogId, memberId, request.body.role);

    response.sendStatus(204);
}

/**
 * Adds a member to the specified project.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function addProjectAddableMember(
    request: Request<ProjectMemberIdParam, void, AddMemberRequest>,
    response: Response<void>,
    next: NextFunction
): Promise<void> {
    const projectId = request.params.projectId;
    const memberId = request.params.memberId;

    const isMember = await isProjectMember(projectId, memberId);
    if (isMember) {
        next(new BadRequestError("User is already a member of this project"));
        return;
    }
    await MembersService.addProjectAddableMember(projectId, memberId, request.body.role);

    response.sendStatus(204);
}

/**
 * Updates the role of a member in a catalog.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function updateCatalogAddedMember(
    request: Request<CatalogMemberIdParam, void, UpdateMemberRequest>,
    response: Response<void>,
    next: NextFunction
): Promise<void> {
    const catalogId = request.params.catalogId;
    const memberId = request.params.memberId;

    const isMember = await isCatalogMember(catalogId, memberId);
    if (!isMember) {
        next(new BadRequestError("User is not a member of this catalog"));
        return;
    }
    await MembersService.updateCatalogAddedMember(catalogId, memberId, request.body.role);

    response.sendStatus(204);
}

/**
 * Updates the role of a member in a project.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function updateProjectAddedMember(
    request: Request<ProjectMemberIdParam, void, UpdateMemberRequest>,
    response: Response<void>,
    next: NextFunction
): Promise<void> {
    const projectId = request.params.projectId;
    const memberId = request.params.memberId;

    const isMember = await isProjectMember(projectId, memberId);
    if (!isMember) {
        next(new BadRequestError("User is not a member of this project"));
        return;
    }
    await MembersService.updateProjectAddedMember(projectId, memberId, request.body.role);

    response.sendStatus(204);
}

/**
 * Deletes a member from the specified catalog.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function deleteCatalogAddedMember(
    request: Request<CatalogMemberIdParam, void, void>,
    response: Response<void>,
    next: NextFunction
): Promise<void> {
    const catalogId = request.params.catalogId;
    const memberId = request.params.memberId;

    const isMember = await isCatalogMember(catalogId, memberId);
    if (!isMember) {
        next(new BadRequestError("User is not a member of this catalog"));
        return;
    }
    await removeCatalogMember(catalogId, memberId);

    response.sendStatus(204);
}

/**
 * Deletes a member from the specified project.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function deleteProjectAddedMember(
    request: Request<ProjectMemberIdParam, void, void>,
    response: Response<void>,
    next: NextFunction
): Promise<void> {
    const projectId = request.params.projectId;
    const memberId = request.params.memberId;

    const isMember = await isProjectMember(projectId, memberId);
    if (!isMember) {
        next(new BadRequestError("User is not a member of this project"));
        return;
    }
    await removeProjectMember(projectId, memberId);

    response.sendStatus(204);
}
