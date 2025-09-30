/**
 * Module that defines the routes for the assets
 * of a project.
 */
import express from "express";
import { createAsset, deleteAsset, getAssets, updateAsset } from "#controllers/assets.controller.js";
import { CheckProjectRoleHandler } from "#guards/authorisation.guard.js";
import { ProjectIdParam } from "#types/project.types.js";
import { AssetIdParam, AssetResponse, CreateAssetRequest, UpdateAssetRequest } from "#types/asset.types.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import {
    ValidateBodyHandler,
    ValidateParamHandler,
} from "#middlewares/input-validations/input-validation.middleware.js";

export const assetsRouter = express.Router({ mergeParams: true });
const idParam = "assetId";

assetsRouter.get<ProjectIdParam, AssetResponse[], void>("/", CheckProjectRoleHandler(USER_ROLES.VIEWER), getAssets);

assetsRouter.post<ProjectIdParam, AssetResponse, CreateAssetRequest>(
    "/",
    ValidateParamHandler(ProjectIdParam),
    ValidateBodyHandler(CreateAssetRequest),
    CheckProjectRoleHandler(USER_ROLES.EDITOR),
    createAsset
);

assetsRouter.put<AssetIdParam, AssetResponse, UpdateAssetRequest>(
    `/:${idParam}`,
    ValidateParamHandler(AssetIdParam),
    ValidateBodyHandler(UpdateAssetRequest),
    CheckProjectRoleHandler(USER_ROLES.EDITOR),
    updateAsset
);

assetsRouter.delete<AssetIdParam, void, void>(
    `/:${idParam}`,
    ValidateParamHandler(AssetIdParam),
    CheckProjectRoleHandler(USER_ROLES.EDITOR),
    deleteAsset
);
