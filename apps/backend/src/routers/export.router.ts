/**
 * Module that defines the routes of for the
 * export of projects
 */

import express from "express";
import { exportProject } from "#controllers/exportProjects.controller.js";
import { CheckProjectRoleHandler } from "#guards/authorisation.guard.js";
import { ProjectIdParam } from "#types/project.types.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import { ValidateParamHandler } from "#middlewares/input-validations/input-validation.middleware.js";

export const exportRouter = express.Router();
const idParam = "projectId";

/** routes for project export for the specific project. */
exportRouter.get<ProjectIdParam>(
    `/:${idParam}`,
    ValidateParamHandler(ProjectIdParam),
    CheckProjectRoleHandler(USER_ROLES.OWNER),
    exportProject
);
