/**
 * Module that defines the routes for the members
 * for each project or catalog.
 */
import express from "express";
import { CheckProjectRoleHandler } from "#guards/authorisation.guard.js";
import { ProjectIdParam } from "#types/project.types.js";
import {
    AddMemberRequest,
    MemberResponse,
    ProjectMemberIdParam,
    UpdateMemberRequest,
    UserResponse,
} from "#types/member.types.js";
import {
    addProjectAddableMember,
    deleteProjectAddedMember,
    getProjectAddableMembers,
    getProjectAddedMembers,
    updateProjectAddedMember,
} from "#controllers/members.controller.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import {
    ValidateBodyHandler,
    ValidateParamHandler,
} from "#middlewares/input-validations/input-validation.middleware.js";

export const projectMembersRouter = express.Router({ mergeParams: true });
const idParam = "memberId";

projectMembersRouter.get<ProjectIdParam, MemberResponse[], void>(
    "/",
    ValidateParamHandler(ProjectIdParam),
    CheckProjectRoleHandler(USER_ROLES.EDITOR),
    getProjectAddedMembers
);

projectMembersRouter.get<ProjectIdParam, UserResponse[], void>(
    "/addable",
    ValidateParamHandler(ProjectIdParam),
    CheckProjectRoleHandler(USER_ROLES.EDITOR),
    getProjectAddableMembers
);

projectMembersRouter.post<ProjectMemberIdParam, void, AddMemberRequest>(
    `/:${idParam}`,
    ValidateParamHandler(ProjectMemberIdParam),
    ValidateBodyHandler(AddMemberRequest),
    CheckProjectRoleHandler(USER_ROLES.OWNER),
    addProjectAddableMember
);

projectMembersRouter.put<ProjectMemberIdParam, void, UpdateMemberRequest>(
    `/:${idParam}`,
    ValidateParamHandler(ProjectMemberIdParam),
    ValidateBodyHandler(UpdateMemberRequest),
    CheckProjectRoleHandler(USER_ROLES.EDITOR),
    updateProjectAddedMember
);

projectMembersRouter.delete<ProjectMemberIdParam, void, void>(
    `/:${idParam}`,
    ValidateParamHandler(ProjectMemberIdParam),
    CheckProjectRoleHandler(USER_ROLES.OWNER),
    deleteProjectAddedMember
);
