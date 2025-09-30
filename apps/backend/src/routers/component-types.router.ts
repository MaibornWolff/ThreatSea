/**
 * Module that defines the routes for
 * the components in the system view.
 */
import express from "express";
import {
    createComponentType,
    deleteComponentType,
    getComponentTypes,
    updateComponentType,
} from "#controllers/component-types.controller.js";
import { CheckProjectRoleHandler } from "#guards/authorisation.guard.js";
import { ProjectIdParam } from "#types/project.types.js";
import {
    ComponentTypeIdParam,
    ComponentTypeResponse,
    CreateComponentTypeRequest,
    UpdateComponentTypeRequest,
} from "#types/component-type.types.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import {
    ValidateBodyHandler,
    ValidateParamHandler,
} from "#middlewares/input-validations/input-validation.middleware.js";

export const componentTypesRouter = express.Router({ mergeParams: true });
const idParam = "componentTypeId";

componentTypesRouter.get<ProjectIdParam, ComponentTypeResponse[], void>(
    "/",
    ValidateParamHandler(ProjectIdParam),
    CheckProjectRoleHandler(USER_ROLES.VIEWER),
    getComponentTypes
);

componentTypesRouter.post<ProjectIdParam, ComponentTypeResponse, CreateComponentTypeRequest>(
    "/",
    ValidateParamHandler(ProjectIdParam),
    ValidateBodyHandler(CreateComponentTypeRequest),
    CheckProjectRoleHandler(USER_ROLES.EDITOR),
    createComponentType
);

componentTypesRouter.put<ComponentTypeIdParam, ComponentTypeResponse, UpdateComponentTypeRequest>(
    `/:${idParam}`,
    ValidateParamHandler(ComponentTypeIdParam),
    ValidateBodyHandler(UpdateComponentTypeRequest),
    CheckProjectRoleHandler(USER_ROLES.EDITOR),
    updateComponentType
);

componentTypesRouter.delete<ComponentTypeIdParam, void, void>(
    `/:${idParam}`,
    ValidateParamHandler(ComponentTypeIdParam),
    CheckProjectRoleHandler(USER_ROLES.EDITOR),
    deleteComponentType
);
