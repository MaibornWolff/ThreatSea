/**
 * Module that defines the routes of for the
 * projects and project creation/change/deletion.
 */
import express from "express";
import { assetsRouter } from "#routers/assets.router.js";
import { componentTypesRouter } from "#routers/component-types.router.js";
import { systemRouter } from "#routers/system.router.js";
import {
    createProject,
    deleteProject,
    generateReport,
    getProject,
    getProjects,
    updateProject,
    updateProjectLineOfTolerance,
} from "#controllers/projects.controller.js";
import { CheckProjectExistenceHandler } from "#middlewares/check-existence.middleware.js";
import { CheckProjectRoleHandler } from "#guards/authorisation.guard.js";
import {
    CreateProjectRequest,
    ExtendedProjectResponse,
    ProjectIdParam,
    ProjectResponse,
    UpdateProjectLineOfToleranceRequest,
    UpdateProjectRequest,
} from "#types/project.types.js";
import { projectMembersRouter } from "#routers/project-members.router.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import {
    ValidateBodyHandler,
    ValidateParamHandler,
} from "#middlewares/input-validations/input-validation.middleware.js";

export const projectsRouter = express.Router();
const idParam = "projectId";

/** routes for project creation/change and for the specific projects. */
projectsRouter.get<void, ExtendedProjectResponse[], void>("/", getProjects);

projectsRouter.get<ProjectIdParam, ProjectResponse, void>(
    `/:${idParam}`,
    ValidateParamHandler(ProjectIdParam),
    CheckProjectExistenceHandler,
    CheckProjectRoleHandler(USER_ROLES.VIEWER),
    getProject
);

projectsRouter.post<void, ProjectResponse, CreateProjectRequest>(
    "/",
    ValidateBodyHandler(CreateProjectRequest),
    createProject
);

projectsRouter.put<ProjectIdParam, ProjectResponse, UpdateProjectRequest>(
    `/:${idParam}`,
    ValidateParamHandler(ProjectIdParam),
    ValidateBodyHandler(UpdateProjectRequest),
    CheckProjectExistenceHandler,
    CheckProjectRoleHandler(USER_ROLES.OWNER),
    updateProject
);

// Separate from the project update so Editors can save the lines of tolerance without being able to edit project details.
projectsRouter.put<ProjectIdParam, ProjectResponse, UpdateProjectLineOfToleranceRequest>(
    `/:${idParam}/lineOfTolerance`,
    ValidateParamHandler(ProjectIdParam),
    ValidateBodyHandler(UpdateProjectLineOfToleranceRequest),
    CheckProjectExistenceHandler,
    CheckProjectRoleHandler(USER_ROLES.EDITOR),
    updateProjectLineOfTolerance
);

projectsRouter.delete<ProjectIdParam, void, void>(
    `/:${idParam}`,
    ValidateParamHandler(ProjectIdParam),
    CheckProjectExistenceHandler,
    CheckProjectRoleHandler(USER_ROLES.OWNER),
    deleteProject
);

projectsRouter.get<ProjectIdParam>(
    `/:${idParam}/report`,
    ValidateParamHandler(ProjectIdParam),
    CheckProjectExistenceHandler,
    CheckProjectRoleHandler(USER_ROLES.VIEWER),
    generateReport
);

/** Assigns router middleware to the given routes */
projectsRouter.use(`/:${idParam}/assets`, ValidateParamHandler(ProjectIdParam), CheckProjectExistenceHandler);
projectsRouter.use(`/:${idParam}/assets`, assetsRouter);

projectsRouter.use(`/:${idParam}/componentTypes`, ValidateParamHandler(ProjectIdParam), CheckProjectExistenceHandler);
projectsRouter.use(`/:${idParam}/componentTypes`, componentTypesRouter);

projectsRouter.use(`/:${idParam}/system`, ValidateParamHandler(ProjectIdParam), CheckProjectExistenceHandler);
projectsRouter.use(`/:${idParam}/system`, systemRouter);

projectsRouter.use(`/:${idParam}/members`, ValidateParamHandler(ProjectIdParam), CheckProjectExistenceHandler);
projectsRouter.use(`/:${idParam}/members`, projectMembersRouter);
