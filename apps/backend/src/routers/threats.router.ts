/**
 * Module that defines the routes of the
 * threats for each project.
 */
import express from "express";
import { createThreat, deleteThreats, getThreat, getThreats, updateThreats } from "#controllers/threats.controller.js";
import { CheckProjectRoleHandler } from "#guards/authorisation.guard.js";
import { ProjectIdParam } from "#types/project.types.js";
import {
    CreateThreatRequest,
    ExtendedThreatResponse,
    ThreatIdParam,
    ThreatResponse,
    UpdateThreatRequest,
} from "#types/threat.types.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import {
    ValidateBodyHandler,
    ValidateParamHandler,
} from "#middlewares/input-validations/input-validation.middleware.js";

export const threatsRouter = express.Router({ mergeParams: true });
const idParam = "threatId";

threatsRouter.get<ProjectIdParam, ExtendedThreatResponse[], void>(
    "/",
    ValidateParamHandler(ProjectIdParam),
    CheckProjectRoleHandler(USER_ROLES.VIEWER),
    getThreats
);

threatsRouter.get<ThreatIdParam, ThreatResponse, void>(
    `/:${idParam}`,
    ValidateParamHandler(ThreatIdParam),
    CheckProjectRoleHandler(USER_ROLES.VIEWER),
    getThreat
);

threatsRouter.post<ProjectIdParam, ThreatResponse, CreateThreatRequest>(
    "/",
    ValidateParamHandler(ProjectIdParam),
    ValidateBodyHandler(CreateThreatRequest),
    CheckProjectRoleHandler(USER_ROLES.EDITOR),
    createThreat
);

threatsRouter.put<ThreatIdParam, ThreatResponse, UpdateThreatRequest>(
    `/:${idParam}`,
    ValidateParamHandler(ThreatIdParam),
    ValidateBodyHandler(UpdateThreatRequest),
    CheckProjectRoleHandler(USER_ROLES.EDITOR),
    updateThreats
);

threatsRouter.delete<ThreatIdParam, void, void>(
    `/:${idParam}`,
    ValidateParamHandler(ThreatIdParam),
    CheckProjectRoleHandler(USER_ROLES.EDITOR),
    deleteThreats
);
