import { ProjectIdParam } from "#types/project.types.js";
import { IsDefined, IsInt, IsISO8601, IsNotEmpty, IsString, Length, MaxLength, ValidateIf } from "class-validator";
import {
    FIELD_MUST_BE_INT_MESSAGE,
    FIELD_MUST_BE_ISO_8601_DATE,
    FIELD_MUST_BE_STRING_MESSAGE,
    FIELD_MUST_EXIST_MESSAGE,
    MAX_DESCRIPTION_LENGTH,
    MAX_NAME_LENGTH,
    PARAM_MUST_BE_INT_MESSAGE,
    PARAM_MUST_EXIST_MESSAGE,
    STRING_MUST_NOT_BE_EMPTY_MESSAGE,
    STRING_TOO_LONG_MESSAGE,
} from "#middlewares/input-validations/validator-messages.js";
import { Type } from "class-transformer";
import { Trim } from "#middlewares/input-validations/trim.decorator.js";

export class MeasureIdParam extends ProjectIdParam {
    @IsDefined({ message: PARAM_MUST_EXIST_MESSAGE("measureId") })
    @Type(() => Number)
    @IsInt({ message: PARAM_MUST_BE_INT_MESSAGE("measureId") })
    measureId!: number;
}

export class UpdateMeasureRequest {
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

    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("scheduledAt") })
    @IsString({ message: FIELD_MUST_BE_STRING_MESSAGE("scheduledAt") })
    @IsISO8601({ strict: true }, { message: FIELD_MUST_BE_ISO_8601_DATE("scheduledAt") })
    scheduledAt!: string;
}

export class CreateMeasureRequest extends UpdateMeasureRequest {
    @ValidateIf((_, value) => value != null)
    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("catalogMeasureId") })
    @IsInt({ message: FIELD_MUST_BE_INT_MESSAGE("catalogMeasureId") })
    catalogMeasureId!: number | null;
}

export interface MeasureResponse extends CreateMeasureRequest {
    id: number;
    projectId: number;
    catalogMeasureId: number | null;
    createdAt: string;
    updatedAt: string;
}
