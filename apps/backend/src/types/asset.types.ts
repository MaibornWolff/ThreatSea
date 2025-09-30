import { ProjectIdParam } from "#types/project.types.js";
import { IsDefined, IsInt, IsNotEmpty, IsString, Length, Max, Min } from "class-validator";
import {
    CIA_VALUE_MAX,
    CIA_VALUE_MIN,
    FIELD_MUST_BE_INT_MESSAGE,
    FIELD_MUST_BE_STRING_MESSAGE,
    FIELD_MUST_EXIST_MESSAGE,
    INT_MUST_BE_BETWEEN_MESSAGE,
    MAX_DESCRIPTION_LENGTH,
    MAX_NAME_LENGTH,
    PARAM_MUST_BE_INT_MESSAGE,
    PARAM_MUST_EXIST_MESSAGE,
    STRING_MUST_NOT_BE_EMPTY_MESSAGE,
    STRING_TOO_LONG_MESSAGE,
} from "#middlewares/input-validations/validator-messages.js";
import { Type } from "class-transformer";
import { Trim } from "#middlewares/input-validations/trim.decorator.js";

export class AssetIdParam extends ProjectIdParam {
    @IsDefined({ message: PARAM_MUST_EXIST_MESSAGE("assetId") })
    @Type(() => Number)
    @IsInt({ message: PARAM_MUST_BE_INT_MESSAGE("assetId") })
    assetId!: number;
}

export class CreateAssetRequest {
    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("name") })
    @IsString({ message: FIELD_MUST_BE_STRING_MESSAGE("name") })
    @Trim()
    @IsNotEmpty({ message: STRING_MUST_NOT_BE_EMPTY_MESSAGE("name") })
    @Length(1, MAX_NAME_LENGTH, { message: STRING_TOO_LONG_MESSAGE("name", MAX_NAME_LENGTH) })
    name!: string;

    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("description") })
    @IsString({ message: FIELD_MUST_BE_STRING_MESSAGE("description") })
    @Trim()
    @Length(0, MAX_DESCRIPTION_LENGTH, { message: STRING_TOO_LONG_MESSAGE("description", MAX_DESCRIPTION_LENGTH) })
    description!: string;

    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("confidentiality") })
    @IsInt({ message: FIELD_MUST_BE_INT_MESSAGE("confidentiality") })
    @Min(CIA_VALUE_MIN, { message: INT_MUST_BE_BETWEEN_MESSAGE("confidentiality", CIA_VALUE_MIN, CIA_VALUE_MAX) })
    @Max(CIA_VALUE_MAX, { message: INT_MUST_BE_BETWEEN_MESSAGE("confidentiality", CIA_VALUE_MIN, CIA_VALUE_MAX) })
    confidentiality!: number;

    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("confidentialityJustification") })
    @IsString({ message: FIELD_MUST_BE_STRING_MESSAGE("confidentialityJustification") })
    @Trim()
    @Length(0, MAX_DESCRIPTION_LENGTH, {
        message: STRING_TOO_LONG_MESSAGE("confidentialityJustification", MAX_DESCRIPTION_LENGTH),
    })
    confidentialityJustification!: string;

    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("integrity") })
    @IsInt({ message: FIELD_MUST_BE_INT_MESSAGE("integrity") })
    @Min(CIA_VALUE_MIN, { message: INT_MUST_BE_BETWEEN_MESSAGE("integrity", CIA_VALUE_MIN, CIA_VALUE_MAX) })
    @Max(CIA_VALUE_MAX, { message: INT_MUST_BE_BETWEEN_MESSAGE("integrity", CIA_VALUE_MIN, CIA_VALUE_MAX) })
    integrity!: number;

    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("integrityJustification") })
    @IsString({ message: FIELD_MUST_BE_STRING_MESSAGE("integrityJustification") })
    @Trim()
    @Length(0, MAX_DESCRIPTION_LENGTH, {
        message: STRING_TOO_LONG_MESSAGE("integrityJustification", MAX_DESCRIPTION_LENGTH),
    })
    integrityJustification!: string;

    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("availability") })
    @IsInt({ message: FIELD_MUST_BE_INT_MESSAGE("availability") })
    @Min(CIA_VALUE_MIN, { message: INT_MUST_BE_BETWEEN_MESSAGE("availability", CIA_VALUE_MIN, CIA_VALUE_MAX) })
    @Max(CIA_VALUE_MAX, { message: INT_MUST_BE_BETWEEN_MESSAGE("availability", CIA_VALUE_MIN, CIA_VALUE_MAX) })
    availability!: number;

    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("availabilityJustification") })
    @IsString({ message: FIELD_MUST_BE_STRING_MESSAGE("availabilityJustification") })
    @Trim()
    @Length(0, MAX_DESCRIPTION_LENGTH, {
        message: STRING_TOO_LONG_MESSAGE("availabilityJustification", MAX_DESCRIPTION_LENGTH),
    })
    availabilityJustification!: string;
}

export { CreateAssetRequest as UpdateAssetRequest };

export interface AssetResponse extends CreateAssetRequest {
    id: number;
    projectId: number;
    createdAt: string;
    updatedAt: string;
}
