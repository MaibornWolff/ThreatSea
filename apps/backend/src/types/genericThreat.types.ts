import { ProjectIdParam } from "#types/project.types.js";
import { POINTS_OF_ATTACK } from "./points-of-attack.types.js";
import { ATTACKERS } from "./attackers.types.js";
import { IsDefined, IsEnum, IsInt, IsNotEmpty, IsString, Length } from "class-validator";
import {
    FIELD_MUST_BE_INT_MESSAGE,
    FIELD_MUST_BE_ONE_OF_MESSAGE,
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
import { ExtendedChildThreatResponse } from "./childThreat.types.js";

export class GenericThreatIdParam extends ProjectIdParam {
    @IsDefined({ message: PARAM_MUST_EXIST_MESSAGE("genericThreatId") })
    @Type(() => Number)
    @IsInt({ message: PARAM_MUST_BE_INT_MESSAGE("genericThreatId") })
    genericThreatId!: number;
}

export class UpdateGenericThreatRequest {
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
}

export class CreateGenericThreatRequest extends UpdateGenericThreatRequest {
    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("catalogThreatId") })
    @IsInt({ message: FIELD_MUST_BE_INT_MESSAGE("catalogThreatId") })
    catalogThreatId!: number;

    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("pointOfAttackId") })
    @IsString({ message: FIELD_MUST_BE_STRING_MESSAGE("pointOfAttackId") })
    pointOfAttackId!: string;

    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("pointOfAttack") })
    @IsString({ message: FIELD_MUST_BE_STRING_MESSAGE("pointOfAttack") })
    @IsEnum(POINTS_OF_ATTACK, {
        message: FIELD_MUST_BE_ONE_OF_MESSAGE("pointOfAttack", Object.values(POINTS_OF_ATTACK)),
    })
    pointOfAttack!: POINTS_OF_ATTACK;

    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("attacker") })
    @IsString({ message: FIELD_MUST_BE_STRING_MESSAGE("attacker") })
    @IsEnum(ATTACKERS, { message: FIELD_MUST_BE_ONE_OF_MESSAGE("attacker", Object.values(ATTACKERS)) })
    attacker!: ATTACKERS;
}

export interface GenericThreatResponse extends CreateGenericThreatRequest {
    id: number;
    projectId: number;
    createdAt: string;
    updatedAt: string;
}

export interface GenericThreatWithExtendedChildrenResponse extends GenericThreatResponse {
    children: ExtendedChildThreatResponse[];
}
