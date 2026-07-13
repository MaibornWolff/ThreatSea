/**
 * Routes for child threats.
 */
import express from "express";
import {
    createThreat,
    deleteThreat,
    getThreat,
    getThreatsByGenericThreatId,
    updateThreat,
} from "#controllers/threats.controller.js";
import { CheckProjectRoleHandler } from "#guards/authorisation.guard.js";
import { ThreatIdParam, ThreatResponse, CreateThreatRequest, UpdateThreatRequest } from "#types/threat.types.js";
import { GenericThreatIdParam } from "#types/generic-threat.types.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import {
    ValidateBodyHandler,
    ValidateParamHandler,
} from "#middlewares/input-validations/input-validation.middleware.js";

export const threatsRouter = express.Router({ mergeParams: true });
const idParam = "threatId";

threatsRouter.get<GenericThreatIdParam, ThreatResponse[], void>(
    "/:genericThreatId/list",
    ValidateParamHandler(GenericThreatIdParam),
    CheckProjectRoleHandler(USER_ROLES.VIEWER),
    getThreatsByGenericThreatId
);

threatsRouter.get<ThreatIdParam, ThreatResponse, void>(
    `/:${idParam}`,
    ValidateParamHandler(ThreatIdParam),
    CheckProjectRoleHandler(USER_ROLES.VIEWER),
    getThreat
);

threatsRouter.post<GenericThreatIdParam, ThreatResponse, CreateThreatRequest>(
    "/:genericThreatId",
    ValidateParamHandler(GenericThreatIdParam),
    ValidateBodyHandler(CreateThreatRequest),
    CheckProjectRoleHandler(USER_ROLES.EDITOR),
    createThreat
);

threatsRouter.put<ThreatIdParam, ThreatResponse, UpdateThreatRequest>(
    `/:${idParam}`,
    ValidateParamHandler(ThreatIdParam),
    ValidateBodyHandler(UpdateThreatRequest),
    CheckProjectRoleHandler(USER_ROLES.EDITOR),
    updateThreat
);

threatsRouter.delete<ThreatIdParam, void, void>(
    `/:${idParam}`,
    ValidateParamHandler(ThreatIdParam),
    CheckProjectRoleHandler(USER_ROLES.EDITOR),
    deleteThreat
);

export default threatsRouter;
