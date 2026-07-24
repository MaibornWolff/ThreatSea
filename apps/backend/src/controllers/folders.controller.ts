/**
 * Module that defines the controller functions for the routes of per-user project folders.
 */
import { NextFunction, Request, Response } from "express";
import * as FoldersService from "#services/folders.service.js";
import { NotFoundError } from "#errors/not-found.error.js";
import {
    CreateFolderRequest,
    FolderIdParam,
    FolderResponse,
    MoveProjectRequest,
    UpdateFolderRequest,
} from "#types/folder.types.js";
import { ExtendedProjectResponse, ProjectIdParam } from "#types/project.types.js";

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
 * Moves a project into a folder (or out of any folder when folderId is null) for the
 * current user. Returns the updated project so the client can refresh its placement.
 */
export async function moveProjectToFolder(
    request: Request<ProjectIdParam, ExtendedProjectResponse, MoveProjectRequest>,
    response: Response<ExtendedProjectResponse>,
    next: NextFunction
): Promise<void> {
    try {
        const project = await FoldersService.moveProject(
            request.user!.id!,
            request.params.projectId,
            request.body.folderId
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
