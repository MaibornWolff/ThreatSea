import type { USER_ROLES } from "#api/types/user-roles.types.ts";

export interface AddMemberRequest {
    projectCatalogId: number;
    memberPath: string;
    role: USER_ROLES;
    id: number;
}

export type UpdateMemberRequest = AddMemberRequest;

export type RemoveMemberRequest = Omit<AddMemberRequest, "role">;

export interface User {
    id: number;
    name: string;
    email: string;
}

export interface Member extends User {
    role: USER_ROLES;
}
