/**
 * Module that defines the routes for the measures
 * for each project.
 */
import express from "express";
import { createMeasure, deleteMeasure, getMeasures, updateMeasure } from "#controllers/measures.controller.js";
import { CheckProjectRoleHandler } from "#guards/authorisation.guard.js";
import { ProjectIdParam } from "#types/project.types.js";
import { CreateMeasureRequest, MeasureIdParam, MeasureResponse, UpdateMeasureRequest } from "#types/measure.types.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import {
    ValidateBodyHandler,
    ValidateParamHandler,
} from "#middlewares/input-validations/input-validation.middleware.js";

export const measuresRouter = express.Router({ mergeParams: true });
const idParam = "measureId";

measuresRouter.get<ProjectIdParam, MeasureResponse[], void>(
    "/",
    ValidateParamHandler(ProjectIdParam),
    CheckProjectRoleHandler(USER_ROLES.VIEWER),
    getMeasures
);

measuresRouter.post<ProjectIdParam, MeasureResponse, CreateMeasureRequest>(
    "/",
    ValidateParamHandler(ProjectIdParam),
    ValidateBodyHandler(CreateMeasureRequest),
    CheckProjectRoleHandler(USER_ROLES.EDITOR),
    createMeasure
);

measuresRouter.put<MeasureIdParam, MeasureResponse, UpdateMeasureRequest>(
    `/:${idParam}`,
    ValidateParamHandler(MeasureIdParam),
    ValidateBodyHandler(UpdateMeasureRequest),
    CheckProjectRoleHandler(USER_ROLES.EDITOR),
    updateMeasure
);

measuresRouter.delete<MeasureIdParam, void, void>(
    `/:${idParam}`,
    ValidateParamHandler(MeasureIdParam),
    CheckProjectRoleHandler(USER_ROLES.EDITOR),
    deleteMeasure
);
