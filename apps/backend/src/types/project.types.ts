import { CONFIDENTIALITY_LEVELS } from "./confidentiality-levels.types.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import { Type } from "class-transformer";
import { IsDefined, IsEnum, IsIn, IsInt, IsNotEmpty, IsString, Length, MaxLength, Validate } from "class-validator";
import {
    FIELD_MUST_BE_INT_MESSAGE,
    FIELD_MUST_BE_ONE_OF_MESSAGE,
    FIELD_MUST_BE_STRING_MESSAGE,
    FIELD_MUST_EXIST_MESSAGE,
    LINE_OF_TOLERANCE_GREEN_VALUES,
    LINE_OF_TOLERANCE_RED_VALUES,
    MAX_DESCRIPTION_LENGTH,
    MAX_NAME_LENGTH,
    PARAM_MUST_BE_INT_MESSAGE,
    PARAM_MUST_EXIST_MESSAGE,
    STRING_MUST_NOT_BE_EMPTY_MESSAGE,
    STRING_TOO_LONG_MESSAGE,
} from "#middlewares/input-validations/validator-messages.js";
import { Trim } from "#middlewares/input-validations/trim.decorator.js";
import { ProjectLinesOfToleranceValidator } from "#middlewares/input-validations/project.validator.js";

export class ProjectIdParam {
    @IsDefined({ message: PARAM_MUST_EXIST_MESSAGE("projectId") })
    @Type(() => Number)
    @IsInt({ message: PARAM_MUST_BE_INT_MESSAGE("projectId") })
    projectId!: number;
}

export class CreateProjectRequest {
    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("name") })
    @IsString({ message: FIELD_MUST_BE_STRING_MESSAGE("name") })
    @Trim()
    @IsNotEmpty({ message: STRING_MUST_NOT_BE_EMPTY_MESSAGE("name") })
    @MaxLength(MAX_NAME_LENGTH, { message: STRING_TOO_LONG_MESSAGE("name", MAX_NAME_LENGTH) })
    name!: string;

    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("description") })
    @IsString({ message: FIELD_MUST_BE_STRING_MESSAGE("description") })
    @Trim()
    @Length(0, MAX_DESCRIPTION_LENGTH, { message: STRING_TOO_LONG_MESSAGE("description", MAX_DESCRIPTION_LENGTH) })
    description!: string;

    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("catalogId") })
    @IsInt({ message: FIELD_MUST_BE_INT_MESSAGE("catalogId") })
    catalogId!: number;

    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("confidentialityLevel") })
    @IsString({ message: FIELD_MUST_BE_STRING_MESSAGE("confidentialityLevel") })
    @IsEnum(CONFIDENTIALITY_LEVELS, {
        message: FIELD_MUST_BE_ONE_OF_MESSAGE("confidentialityLevel", Object.values(CONFIDENTIALITY_LEVELS)),
    })
    confidentialityLevel!: CONFIDENTIALITY_LEVELS;
}

export class UpdateProjectRequest {
    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("name") })
    @IsString({ message: FIELD_MUST_BE_STRING_MESSAGE("name") })
    @Trim()
    @IsNotEmpty({ message: STRING_MUST_NOT_BE_EMPTY_MESSAGE("name") })
    @MaxLength(MAX_NAME_LENGTH, { message: STRING_TOO_LONG_MESSAGE("name", MAX_NAME_LENGTH) })
    name!: string;

    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("description") })
    @IsString({ message: FIELD_MUST_BE_STRING_MESSAGE("description") })
    @Trim()
    @Length(0, MAX_DESCRIPTION_LENGTH, { message: STRING_TOO_LONG_MESSAGE("description", MAX_DESCRIPTION_LENGTH) })
    description!: string;

    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("confidentialityLevel") })
    @IsString({ message: FIELD_MUST_BE_STRING_MESSAGE("confidentialityLevel") })
    @IsEnum(CONFIDENTIALITY_LEVELS, {
        message: FIELD_MUST_BE_ONE_OF_MESSAGE("confidentialityLevel", Object.values(CONFIDENTIALITY_LEVELS)),
    })
    confidentialityLevel!: CONFIDENTIALITY_LEVELS;

    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("lineOfToleranceGreen") })
    @IsInt({ message: FIELD_MUST_BE_INT_MESSAGE("lineOfToleranceGreen") })
    @IsIn(LINE_OF_TOLERANCE_GREEN_VALUES, {
        message: FIELD_MUST_BE_ONE_OF_MESSAGE("lineOfToleranceGreen", LINE_OF_TOLERANCE_GREEN_VALUES),
    })
    @Validate(ProjectLinesOfToleranceValidator)
    lineOfToleranceGreen!: number;

    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("lineOfToleranceRed") })
    @IsInt({ message: FIELD_MUST_BE_INT_MESSAGE("lineOfToleranceRed") })
    @IsIn(LINE_OF_TOLERANCE_RED_VALUES, {
        message: FIELD_MUST_BE_ONE_OF_MESSAGE("lineOfToleranceRed", LINE_OF_TOLERANCE_RED_VALUES),
    })
    @Validate(ProjectLinesOfToleranceValidator)
    lineOfToleranceRed!: number;
}

export interface ProjectResponse {
    id: number;
    catalogId: number;
    name: string;
    description?: string;
    confidentialityLevel: CONFIDENTIALITY_LEVELS;
    lineOfToleranceGreen: number;
    lineOfToleranceRed: number;
    createdAt: string;
    updatedAt: string;
}

export interface ExtendedProjectResponse extends ProjectResponse {
    role: USER_ROLES;
    image: string | null;
}
