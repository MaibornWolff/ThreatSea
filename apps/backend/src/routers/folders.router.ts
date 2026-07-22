/**
 * Module that defines the routes for per-user project folders
 * (creation / rename / move / deletion).
 */
import express from "express";
import { createFolder, deleteFolder, getFolders, updateFolder } from "#controllers/folders.controller.js";
import { CheckFolderOwnershipHandler } from "#guards/authorisation.guard.js";
import { CreateFolderRequest, FolderIdParam, FolderResponse, UpdateFolderRequest } from "#types/folder.types.js";
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
