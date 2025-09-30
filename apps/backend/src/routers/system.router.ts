/**
 * Module that defines the routes for the system view and
 * the subviews of the threats and measures.
 */
import express from "express";
import { getSystem, updateSystem } from "#controllers/system.controller.js";
import { threatsRouter } from "#routers/threats.router.js";
import { measuresRouter } from "#routers/measures.router.js";
import { measureImpactRouter } from "#routers/measure-impact.router.js";
import { CheckProjectRoleHandler } from "#guards/authorisation.guard.js";
import { ProjectIdParam } from "#types/project.types.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import { SystemResponse, UpdateSystemRequest } from "#types/system.types.js";
import { ValidateParamHandler } from "#middlewares/input-validations/input-validation.middleware.js";

export const systemRouter = express.Router({ mergeParams: true });

systemRouter.get<ProjectIdParam, SystemResponse, void>(
    "/",
    ValidateParamHandler(ProjectIdParam),
    CheckProjectRoleHandler(USER_ROLES.VIEWER),
    getSystem
);

systemRouter.put<ProjectIdParam, SystemResponse, UpdateSystemRequest>(
    "/",
    ValidateParamHandler(ProjectIdParam),
    CheckProjectRoleHandler(USER_ROLES.EDITOR),
    updateSystem
);

/** Put threats, measures and MeasureImpacts into this router */
systemRouter.use("/threats", threatsRouter);
systemRouter.use("/measures", measuresRouter);
systemRouter.use("/measureImpacts", measureImpactRouter);
