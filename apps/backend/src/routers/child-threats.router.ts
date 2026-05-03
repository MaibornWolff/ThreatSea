/**
 * Routes for child threats nested under a generic threat
 */
import express from "express";
import {
    createChildThreat,
    deleteChildThreat,
    getChildThreat,
    getChildThreatsByGenericThreatId,
    updateChildThreat,
} from "#controllers/childThreats.controller.js";
import { CheckProjectRoleHandler } from "#guards/authorisation.guard.js";
import { GenericThreatIdParam } from "#types/genericThreat.types.js";
import { ChildThreatIdParam, CreateChildThreatRequest, UpdateChildThreatRequest } from "#types/childThreat.types.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import { ValidateBodyHandler, ValidateParamHandler } from "#middlewares/input-validations/input-validation.middleware.js";

export const childThreatsRouter = express.Router({ mergeParams: true });
const idParam = "childThreatId";

childThreatsRouter.get<GenericThreatIdParam, any, void>(
    "/",
    ValidateParamHandler(GenericThreatIdParam),
    CheckProjectRoleHandler(USER_ROLES.VIEWER),
    getChildThreatsByGenericThreatId
);

childThreatsRouter.get<ChildThreatIdParam, any, void>(
    `/:${idParam}`,
    ValidateParamHandler(ChildThreatIdParam),
    CheckProjectRoleHandler(USER_ROLES.VIEWER),
    getChildThreat
);

childThreatsRouter.post<GenericThreatIdParam, any, CreateChildThreatRequest>(
    "/",
    ValidateParamHandler(GenericThreatIdParam),
    ValidateBodyHandler(CreateChildThreatRequest),
    CheckProjectRoleHandler(USER_ROLES.EDITOR),
    createChildThreat
);

childThreatsRouter.put<ChildThreatIdParam, any, UpdateChildThreatRequest>(
    `/:${idParam}`,
    ValidateParamHandler(ChildThreatIdParam),
    ValidateBodyHandler(UpdateChildThreatRequest),
    CheckProjectRoleHandler(USER_ROLES.EDITOR),
    updateChildThreat
);

childThreatsRouter.delete<ChildThreatIdParam, void, void>(
    `/:${idParam}`,
    ValidateParamHandler(ChildThreatIdParam),
    CheckProjectRoleHandler(USER_ROLES.EDITOR),
    deleteChildThreat
);

export default childThreatsRouter;
