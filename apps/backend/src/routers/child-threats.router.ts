/**
 * Routes for child threats.
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
import { ChildThreatIdParam, ChildThreatResponse, UpdateChildThreatRequest } from "#types/childThreat.types.js";
import { GenericThreatIdParam } from "#types/genericThreat.types.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import {
    ValidateBodyHandler,
    ValidateParamHandler,
} from "#middlewares/input-validations/input-validation.middleware.js";

export const childThreatsRouter = express.Router({ mergeParams: true });
const idParam = "childThreatId";

childThreatsRouter.get<GenericThreatIdParam, ChildThreatResponse[], void>(
    "/:genericThreatId/list",
    ValidateParamHandler(GenericThreatIdParam),
    CheckProjectRoleHandler(USER_ROLES.VIEWER),
    getChildThreatsByGenericThreatId
);

childThreatsRouter.get<ChildThreatIdParam, ChildThreatResponse, void>(
    `/:${idParam}`,
    ValidateParamHandler(ChildThreatIdParam),
    CheckProjectRoleHandler(USER_ROLES.VIEWER),
    getChildThreat
);

childThreatsRouter.post<GenericThreatIdParam, ChildThreatResponse, UpdateChildThreatRequest>(
    "/:genericThreatId",
    ValidateParamHandler(GenericThreatIdParam),
    ValidateBodyHandler(UpdateChildThreatRequest),
    CheckProjectRoleHandler(USER_ROLES.EDITOR),
    createChildThreat
);

childThreatsRouter.put<ChildThreatIdParam, ChildThreatResponse, UpdateChildThreatRequest>(
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
