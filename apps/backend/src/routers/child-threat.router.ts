/**
 * Module that defines the routes of child threats
 * for each project.
 */
import express from "express";
import { getChildThreat } from "#controllers/childThreats.controller.js";
import { CheckProjectRoleHandler } from "#guards/authorisation.guard.js";
import { ValidateParamHandler } from "#middlewares/input-validations/input-validation.middleware.js";
import { ChildThreatIdParam } from "#types/childThreat.types.js";
import { USER_ROLES } from "#types/user-roles.types.js";

export const childThreatsRouter = express.Router({ mergeParams: true });
const idParam = "childThreatId";

childThreatsRouter.get(
    `/:${idParam}`,
    ValidateParamHandler(ChildThreatIdParam),
    CheckProjectRoleHandler(USER_ROLES.VIEWER),
    getChildThreat
);
