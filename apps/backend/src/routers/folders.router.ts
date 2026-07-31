/**
 * Module that defines the routes for per-user project folders
 * (creation / rename / move / deletion).
 */
import express from "express";
import {
    addProjectToFolder,
    createFolder,
    deleteFolder,
    getFolders,
    removeProjectFromFolder,
    updateFolder,
} from "#controllers/folders.controller.js";
import { CheckFolderOwnershipHandler, CheckProjectRoleHandler } from "#guards/authorisation.guard.js";
import { CheckProjectExistenceHandler } from "#middlewares/check-existence.middleware.js";
import {
    CreateFolderRequest,
    FolderIdParam,
    FolderProjectParams,
    FolderResponse,
    UpdateFolderRequest,
} from "#types/folder.types.js";
import { ExtendedProjectResponse } from "#types/project.types.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import {
    ValidateBodyHandler,
    ValidateParamHandler,
} from "#middlewares/input-validations/input-validation.middleware.js";

export const foldersRouter = express.Router();
const idParam = "folderId";

/** All folders are scoped to the requesting user inside the service. */
foldersRouter.get<void, FolderResponse[], void>("/", getFolders);

foldersRouter.post<void, FolderResponse, CreateFolderRequest>(
    "/",
    ValidateBodyHandler(CreateFolderRequest),
    createFolder
);

foldersRouter.put<FolderIdParam, FolderResponse, UpdateFolderRequest>(
    `/:${idParam}`,
    ValidateParamHandler(FolderIdParam),
    ValidateBodyHandler(UpdateFolderRequest),
    CheckFolderOwnershipHandler(),
    updateFolder
);

foldersRouter.delete<FolderIdParam, void, void>(
    `/:${idParam}`,
    ValidateParamHandler(FolderIdParam),
    CheckFolderOwnershipHandler(),
    deleteFolder
);

// Per-user placement: a project sits in the caller's folder via their own membership row, so
// filing (PUT) and ungrouping (DELETE) only require VIEWER on the project, plus folder ownership.
foldersRouter.put<FolderProjectParams, ExtendedProjectResponse, void>(
    `/:${idParam}/projects/:projectId`,
    ValidateParamHandler(FolderProjectParams),
    CheckFolderOwnershipHandler(),
    CheckProjectExistenceHandler,
    CheckProjectRoleHandler(USER_ROLES.VIEWER),
    addProjectToFolder
);

foldersRouter.delete<FolderProjectParams, ExtendedProjectResponse, void>(
    `/:${idParam}/projects/:projectId`,
    ValidateParamHandler(FolderProjectParams),
    CheckFolderOwnershipHandler(),
    CheckProjectExistenceHandler,
    CheckProjectRoleHandler(USER_ROLES.VIEWER),
    removeProjectFromFolder
);
