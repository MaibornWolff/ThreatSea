/**
 * Module that defines the routes of generic threats
 * for each project.
 */
import express from "express";
import { getGenericThreat, getGenericThreatsByProjectId } from "#controllers/genericThreats.controller.js";
import { CheckProjectRoleHandler } from "#guards/authorisation.guard.js";
import { ValidateParamHandler } from "#middlewares/input-validations/input-validation.middleware.js";
import { GenericThreatIdParam } from "#types/genericThreat.types.js";
import { ProjectIdParam } from "#types/project.types.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import { getChildThreatsByGenericThreatId } from "#controllers/childThreats.controller.js";

export const genericThreatsRouter = express.Router({ mergeParams: true });
const idParam = "genericThreatId";

genericThreatsRouter.get(
    "/",
    ValidateParamHandler(ProjectIdParam),
    CheckProjectRoleHandler(USER_ROLES.VIEWER),
    getGenericThreatsByProjectId
);

genericThreatsRouter.get(
    `/:${idParam}`,
    ValidateParamHandler(GenericThreatIdParam),
    CheckProjectRoleHandler(USER_ROLES.VIEWER),
    getGenericThreat
);

genericThreatsRouter.get(
    `/:${idParam}/child-threats`,
    ValidateParamHandler(GenericThreatIdParam),
    CheckProjectRoleHandler(USER_ROLES.VIEWER),
    getChildThreatsByGenericThreatId
);
