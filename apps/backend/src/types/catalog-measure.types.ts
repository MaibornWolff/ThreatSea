import { CatalogIdParam } from "#types/catalog.types.js";
import { ATTACKERS } from "./attackers.types.js";
import { POINTS_OF_ATTACK } from "./points-of-attack.types.js";
import { IsBoolean, IsDefined, IsEnum, IsInt, IsNotEmpty, IsString, Length, Max, Min } from "class-validator";
import {
    FIELD_MUST_BE_BOOLEAN_MESSAGE,
    FIELD_MUST_BE_INT_MESSAGE,
    FIELD_MUST_BE_ONE_OF_MESSAGE,
    FIELD_MUST_BE_STRING_MESSAGE,
    FIELD_MUST_EXIST_MESSAGE,
    INT_MUST_BE_BETWEEN_MESSAGE,
    MAX_DESCRIPTION_LENGTH,
    MAX_NAME_LENGTH,
    PARAM_MUST_BE_INT_MESSAGE,
    PARAM_MUST_EXIST_MESSAGE,
    PROBABILITY_VALUE_MAX,
    PROBABILITY_VALUE_MIN,
    STRING_MUST_NOT_BE_EMPTY_MESSAGE,
    STRING_TOO_LONG_MESSAGE,
} from "#middlewares/input-validations/validator-messages.js";
import { Type } from "class-transformer";
import { Trim } from "#middlewares/input-validations/trim.decorator.js";

export class CatalogMeasureIdParam extends CatalogIdParam {
    @IsDefined({ message: PARAM_MUST_EXIST_MESSAGE("catalogMeasureId") })
    @Type(() => Number)
    @IsInt({ message: PARAM_MUST_BE_INT_MESSAGE("catalogMeasureId") })
    catalogMeasureId!: number;
}

export class CreateCatalogMeasureRequest {
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

    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("attacker") })
    @IsString({ message: FIELD_MUST_BE_STRING_MESSAGE("attacker") })
    @IsEnum(ATTACKERS, { message: FIELD_MUST_BE_ONE_OF_MESSAGE("attacker", Object.values(ATTACKERS)) })
    attacker!: ATTACKERS;

    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("pointOfAttack") })
    @IsString({ message: FIELD_MUST_BE_STRING_MESSAGE("pointOfAttack") })
    @IsEnum(POINTS_OF_ATTACK, {
        message: FIELD_MUST_BE_ONE_OF_MESSAGE("pointOfAttack", Object.values(POINTS_OF_ATTACK)),
    })
    pointOfAttack!: POINTS_OF_ATTACK;

    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("probability") })
    @IsInt({ message: FIELD_MUST_BE_INT_MESSAGE("probability") })
    @Min(PROBABILITY_VALUE_MIN, {
        message: INT_MUST_BE_BETWEEN_MESSAGE("probability", PROBABILITY_VALUE_MIN, PROBABILITY_VALUE_MAX),
    })
    @Max(PROBABILITY_VALUE_MAX, {
        message: INT_MUST_BE_BETWEEN_MESSAGE("probability", PROBABILITY_VALUE_MIN, PROBABILITY_VALUE_MAX),
    })
    probability!: number;

    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("confidentiality") })
    @IsBoolean({ message: FIELD_MUST_BE_BOOLEAN_MESSAGE("confidentiality") })
    confidentiality!: boolean;

    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("integrity") })
    @IsBoolean({ message: FIELD_MUST_BE_BOOLEAN_MESSAGE("integrity") })
    integrity!: boolean;

    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("availability") })
    @IsBoolean({ message: FIELD_MUST_BE_BOOLEAN_MESSAGE("availability") })
    availability!: boolean;
}

export { CreateCatalogMeasureRequest as UpdateCatalogMeasureRequest };

export interface CatalogMeasureResponse extends Omit<CreateCatalogMeasureRequest, "probability"> {
    id: number;
    catalogId: number;
    createdAt: string;
    updatedAt: string;
    probability: number | null;
}
