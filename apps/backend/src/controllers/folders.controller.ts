/**
 * Module that defines the controller functions for the routes of per-user project folders.
 */
import { NextFunction, Request, Response } from "express";
import * as FoldersService from "#services/folders.service.js";
import { NotFoundError } from "#errors/not-found.error.js";
import {
    CreateFolderRequest,
    FolderIdParam,
    FolderProjectParams,
    FolderResponse,
    UpdateFolderRequest,
} from "#types/folder.types.js";
import { ExtendedProjectResponse } from "#types/project.types.js";

/**
 * Gets all folders of the current user.
 */
export async function getFolders(
    request: Request<void, FolderResponse[], void>,
    response: Response<FolderResponse[]>
): Promise<void> {
    const folders = await FoldersService.getFolders(request.user!.id!);

    response.json(folders);
}

/**
 * Creates a new folder for the current user.
 */
export async function createFolder(
    request: Request<void, FolderResponse, CreateFolderRequest>,
    response: Response<FolderResponse>,
    next: NextFunction
): Promise<void> {
    try {
        const folder = await FoldersService.createFolder(request.user!.id!, request.body);

        response.json(folder);
    } catch (error) {
        next(error);
    }
}

/**
 * Renames and/or moves the specified folder.
 */
export async function updateFolder(
    request: Request<FolderIdParam, FolderResponse, UpdateFolderRequest>,
    response: Response<FolderResponse>,
    next: NextFunction
): Promise<void> {
    try {
        const folder = await FoldersService.updateFolder(request.user!.id!, request.params.folderId, request.body);

        response.json(folder);
    } catch (error) {
        next(error);
    }
}

/**
 * Deletes the specified folder and its subtree; contained projects fall back to ungrouped.
 */
export async function deleteFolder(
    request: Request<FolderIdParam, void, void>,
    response: Response<void>
): Promise<void> {
    await FoldersService.deleteFolder(request.user!.id!, request.params.folderId);

    response.sendStatus(204);
}

/**
 * Files a project into one of the caller's folders. Placement is per-user, so this only
 * changes the caller's own membership row. Returns the updated project.
 */
export async function addProjectToFolder(
    request: Request<FolderProjectParams, ExtendedProjectResponse, void>,
    response: Response<ExtendedProjectResponse>,
    next: NextFunction
): Promise<void> {
    try {
        const project = await FoldersService.moveProject(
            request.user!.id!,
            request.params.projectId,
            request.params.folderId
        );
        if (project === null) {
            next(new NotFoundError("Project not found"));
            return;
        }

        response.json(project);
    } catch (error) {
        next(error);
    }
}

/**
 * Removes a project from a folder for the caller, dropping it back to ungrouped. Returns
 * the updated project so the client can refresh its placement.
 */
export async function removeProjectFromFolder(
    request: Request<FolderProjectParams, ExtendedProjectResponse, void>,
    response: Response<ExtendedProjectResponse>,
    next: NextFunction
): Promise<void> {
    try {
        const project = await FoldersService.moveProject(request.user!.id!, request.params.projectId, null);
        if (project === null) {
            next(new NotFoundError("Project not found"));
            return;
        }

        response.json(project);
    } catch (error) {
        next(error);
    }
}
