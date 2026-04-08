/**
 * Module that defines the routes of for the
 * measureImpacts
 */
import express from "express";
import {
    createMeasureImpact,
    deleteMeasureImpact,
    getMeasureImpact,
    getMeasureImpactsByChildThreat,
    getMeasureImpacts,
    updateMeasureImpact,
} from "#controllers/measureImpacts.controller.js";
import { CheckProjectRoleHandler } from "#guards/authorisation.guard.js";
import { ProjectIdParam } from "#types/project.types.js";
import {
    ChildThreatMeasureImpactResponse,
    CreateMeasureImpactRequest,
    MeasureImpactIdParam,
    MeasureImpactResponse,
    UpdateMeasureImpactRequest,
} from "#types/measure-impact.types.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import {
    ValidateBodyHandler,
    ValidateParamHandler,
} from "#middlewares/input-validations/input-validation.middleware.js";
import { ChildThreatIdParam } from "#types/childThreat.types.js";

export const measureImpactRouter = express.Router({ mergeParams: true });
const idParam = "measureImpactId";

measureImpactRouter.get<ProjectIdParam, MeasureImpactResponse[], void>(
    "/",
    ValidateParamHandler(ProjectIdParam),
    CheckProjectRoleHandler(USER_ROLES.VIEWER),
    getMeasureImpacts
);

measureImpactRouter.get<ChildThreatIdParam, ChildThreatMeasureImpactResponse[], void>(
    "/by-child-threat/:childThreatId",
    ValidateParamHandler(ChildThreatIdParam),
    CheckProjectRoleHandler(USER_ROLES.VIEWER),
    getMeasureImpactsByChildThreat
);

measureImpactRouter.get<MeasureImpactIdParam, MeasureImpactResponse, void>(
    `/:${idParam}`,
    ValidateParamHandler(MeasureImpactIdParam),
    CheckProjectRoleHandler(USER_ROLES.VIEWER),
    getMeasureImpact
);

measureImpactRouter.post<ProjectIdParam, MeasureImpactResponse, CreateMeasureImpactRequest>(
    "/",
    ValidateParamHandler(ProjectIdParam),
    ValidateBodyHandler(CreateMeasureImpactRequest),
    CheckProjectRoleHandler(USER_ROLES.EDITOR),
    createMeasureImpact
);

measureImpactRouter.put<MeasureImpactIdParam, MeasureImpactResponse, UpdateMeasureImpactRequest>(
    `/:${idParam}`,
    ValidateParamHandler(MeasureImpactIdParam),
    ValidateBodyHandler(UpdateMeasureImpactRequest),
    CheckProjectRoleHandler(USER_ROLES.EDITOR),
    updateMeasureImpact
);

measureImpactRouter.delete<MeasureImpactIdParam, void, void>(
    `/:${idParam}`,
    ValidateParamHandler(MeasureImpactIdParam),
    CheckProjectRoleHandler(USER_ROLES.EDITOR),
    deleteMeasureImpact
);
