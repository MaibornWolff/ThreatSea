/**
 * Module that defines the routes for the members
 * for each project or catalog.
 */
import express from "express";
import { CheckCatalogRoleHandler } from "#guards/authorisation.guard.js";
import { CatalogIdParam } from "#types/catalog.types.js";
import {
    addCatalogAddableMember,
    deleteCatalogAddedMember,
    getCatalogAddableMembers,
    getCatalogAddedMembers,
    updateCatalogAddedMember,
} from "#controllers/members.controller.js";
import {
    AddMemberRequest,
    CatalogMemberIdParam,
    MemberResponse,
    UpdateMemberRequest,
    UserResponse,
} from "#types/member.types.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import {
    ValidateBodyHandler,
    ValidateParamHandler,
} from "#middlewares/input-validations/input-validation.middleware.js";

export const catalogMembersRouter = express.Router({ mergeParams: true });
const idParam = "memberId";

catalogMembersRouter.get<CatalogIdParam, MemberResponse[], void>(
    "/",
    ValidateParamHandler(CatalogIdParam),
    CheckCatalogRoleHandler(USER_ROLES.EDITOR),
    getCatalogAddedMembers
);

catalogMembersRouter.get<CatalogIdParam, UserResponse[]>(
    "/addable",
    ValidateParamHandler(CatalogIdParam),
    CheckCatalogRoleHandler(USER_ROLES.EDITOR),
    getCatalogAddableMembers
);

catalogMembersRouter.post<CatalogMemberIdParam, void, AddMemberRequest>(
    `/:${idParam}`,
    ValidateParamHandler(CatalogMemberIdParam),
    ValidateBodyHandler(AddMemberRequest),
    CheckCatalogRoleHandler(USER_ROLES.OWNER),
    addCatalogAddableMember
);

catalogMembersRouter.put<CatalogMemberIdParam, void, UpdateMemberRequest>(
    `/:${idParam}`,
    ValidateParamHandler(CatalogMemberIdParam),
    ValidateBodyHandler(UpdateMemberRequest),
    CheckCatalogRoleHandler(USER_ROLES.EDITOR),
    updateCatalogAddedMember
);

catalogMembersRouter.delete<CatalogMemberIdParam, void, void>(
    `/:${idParam}`,
    ValidateParamHandler(CatalogMemberIdParam),
    CheckCatalogRoleHandler(USER_ROLES.OWNER),
    deleteCatalogAddedMember
);
