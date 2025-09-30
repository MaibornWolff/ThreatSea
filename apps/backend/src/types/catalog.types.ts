import { LANGUAGES } from "#types/languages.type.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import { Type } from "class-transformer";
import { IsBoolean, IsDefined, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Length } from "class-validator";
import {
    FIELD_MUST_BE_BOOLEAN_MESSAGE,
    FIELD_MUST_BE_ONE_OF_MESSAGE,
    FIELD_MUST_BE_STRING_MESSAGE,
    FIELD_MUST_EXIST_MESSAGE,
    MAX_NAME_LENGTH,
    PARAM_MUST_BE_INT_MESSAGE,
    PARAM_MUST_EXIST_MESSAGE,
    STRING_MUST_NOT_BE_EMPTY_MESSAGE,
    STRING_TOO_LONG_MESSAGE,
} from "#middlewares/input-validations/validator-messages.js";
import { Trim } from "#middlewares/input-validations/trim.decorator.js";

export class CatalogIdParam {
    @IsDefined({ message: PARAM_MUST_EXIST_MESSAGE("catalogId") })
    @Type(() => Number)
    @IsInt({ message: PARAM_MUST_BE_INT_MESSAGE("catalogId") })
    catalogId!: number;
}

export class UpdateCatalogRequest {
    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("name") })
    @IsString({ message: FIELD_MUST_BE_STRING_MESSAGE("name") })
    @Trim()
    @IsNotEmpty({ message: STRING_MUST_NOT_BE_EMPTY_MESSAGE("name") })
    @Length(1, MAX_NAME_LENGTH, { message: STRING_TOO_LONG_MESSAGE("name", MAX_NAME_LENGTH) })
    name!: string;
}

export class CreateCatalogRequest extends UpdateCatalogRequest {
    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("language") })
    @IsString({ message: FIELD_MUST_BE_STRING_MESSAGE("language") })
    @IsEnum(LANGUAGES, { message: FIELD_MUST_BE_ONE_OF_MESSAGE("language", Object.values(LANGUAGES)) })
    language!: LANGUAGES;

    @IsOptional()
    @IsBoolean({ message: FIELD_MUST_BE_BOOLEAN_MESSAGE("defaultContent") })
    defaultContent = false;
}
export interface CatalogResponse {
    id: number;
    name: string;
    language: LANGUAGES;
    createdAt: string;
    updatedAt: string;
}

export interface CatalogWithRoleResponse extends CatalogResponse {
    role: USER_ROLES;
}
