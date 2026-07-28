import { ProjectIdParam } from "#types/project.types.js";
import { POINTS_OF_ATTACK } from "./points-of-attack.types.js";
import { ATTACKERS } from "./attackers.types.js";
import { IsDefined, IsInt } from "class-validator";
import {
    PARAM_MUST_BE_INT_MESSAGE,
    PARAM_MUST_EXIST_MESSAGE,
} from "#middlewares/input-validations/validator-messages.js";
import { Type } from "class-transformer";
import { ExtendedThreatResponse } from "./threat.types.js";
import { ComponentType } from "#types/system.types.js";

export class GenericThreatIdParam extends ProjectIdParam {
    @IsDefined({ message: PARAM_MUST_EXIST_MESSAGE("genericThreatId") })
    @Type(() => Number)
    @IsInt({ message: PARAM_MUST_BE_INT_MESSAGE("genericThreatId") })
    genericThreatId!: number;
}

export interface GenericThreatResponse {
    id: number;
    projectId: number;
    name: string;
    description: string;
    catalogThreatId: number;
    pointOfAttackId: string;
    pointOfAttack: POINTS_OF_ATTACK;
    attacker: ATTACKERS;
    createdAt: string;
    updatedAt: string;
}

export interface GenericThreatWithExtendedChildrenResponse extends GenericThreatResponse {
    componentName: string | null;
    componentType: number | ComponentType | null;
    interfaceName: string | null;
    children: ExtendedThreatResponse[];
}
