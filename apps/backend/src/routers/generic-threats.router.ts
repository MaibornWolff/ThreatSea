/**
 * Module that defines the routes of generic threats
 * for each project.
 */
import express from "express";
import {
    getGenericThreatsWithExtendedChildren,
} from "#controllers/genericThreats.controller.js";
import { CheckProjectRoleHandler } from "#guards/authorisation.guard.js";
import { ValidateParamHandler } from "#middlewares/input-validations/input-validation.middleware.js";
import { ProjectIdParam } from "#types/project.types.js";
import { USER_ROLES } from "#types/user-roles.types.js";

export const genericThreatsRouter = express.Router({ mergeParams: true });

genericThreatsRouter.get(
    `/`,
    ValidateParamHandler(ProjectIdParam),
    CheckProjectRoleHandler(USER_ROLES.VIEWER),
    getGenericThreatsWithExtendedChildren
);