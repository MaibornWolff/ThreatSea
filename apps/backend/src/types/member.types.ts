import { CatalogIdParam } from "#types/catalog.types.js";
import { ProjectIdParam } from "#types/project.types.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import { IsDefined, IsEnum, IsInt, IsString } from "class-validator";
import {
    FIELD_MUST_BE_ONE_OF_MESSAGE,
    FIELD_MUST_BE_STRING_MESSAGE,
    FIELD_MUST_EXIST_MESSAGE,
    PARAM_MUST_BE_INT_MESSAGE,
    PARAM_MUST_EXIST_MESSAGE,
} from "#middlewares/input-validations/validator-messages.js";
import { Type } from "class-transformer";

export class CatalogMemberIdParam extends CatalogIdParam {
    @IsDefined({ message: PARAM_MUST_EXIST_MESSAGE("memberId") })
    @Type(() => Number)
    @IsInt({ message: PARAM_MUST_BE_INT_MESSAGE("memberId") })
    memberId!: number;
}

export class ProjectMemberIdParam extends ProjectIdParam {
    @IsDefined({ message: PARAM_MUST_EXIST_MESSAGE("memberId") })
    @Type(() => Number)
    @IsInt({ message: PARAM_MUST_BE_INT_MESSAGE("memberId") })
    memberId!: number;
}

export class AddMemberRequest {
    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("role") })
    @IsString({ message: FIELD_MUST_BE_STRING_MESSAGE("role") })
    @IsEnum(USER_ROLES, { message: FIELD_MUST_BE_ONE_OF_MESSAGE("role", Object.values(USER_ROLES)) })
    role!: USER_ROLES;
}

export { AddMemberRequest as UpdateMemberRequest };

export interface UserResponse {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    createdAt: string;
    updatedAt: string;
}

export interface MemberResponse extends UserResponse {
    role: USER_ROLES;
}
