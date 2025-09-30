import { ProjectIdParam } from "#types/project.types.js";
import { IsBoolean, IsDefined, IsInt, IsString, Length, Validate } from "class-validator";
import {
    FIELD_MUST_BE_BOOLEAN_MESSAGE,
    FIELD_MUST_BE_INT_MESSAGE,
    FIELD_MUST_BE_STRING_MESSAGE,
    FIELD_MUST_EXIST_MESSAGE,
    MAX_DESCRIPTION_LENGTH,
    PARAM_MUST_BE_INT_MESSAGE,
    PARAM_MUST_EXIST_MESSAGE,
    STRING_TOO_LONG_MESSAGE,
} from "#middlewares/input-validations/validator-messages.js";
import { Type } from "class-transformer";
import { Trim } from "#middlewares/input-validations/trim.decorator.js";
import {
    MeasureImpactDamageValidator,
    MeasureImpactProbabilityValidator,
} from "#middlewares/input-validations/measure-impact.validator.js";

export class MeasureImpactIdParam extends ProjectIdParam {
    @IsDefined({ message: PARAM_MUST_EXIST_MESSAGE("measureImpactId") })
    @Type(() => Number)
    @IsInt({ message: PARAM_MUST_BE_INT_MESSAGE("measureImpactId") })
    measureImpactId!: number;
}

export class UpdateMeasureImpactRequest {
    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("description") })
    @IsString({ message: FIELD_MUST_BE_STRING_MESSAGE("description") })
    @Trim()
    @Length(0, MAX_DESCRIPTION_LENGTH, { message: STRING_TOO_LONG_MESSAGE("description", MAX_DESCRIPTION_LENGTH) })
    description!: string;

    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("setsOutOfScope") })
    @IsBoolean({ message: FIELD_MUST_BE_BOOLEAN_MESSAGE("setsOutOfScope") })
    setsOutOfScope!: boolean;

    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("impactsProbability") })
    @IsBoolean({ message: FIELD_MUST_BE_BOOLEAN_MESSAGE("impactsProbability") })
    impactsProbability!: boolean;

    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("impactsDamage") })
    @IsBoolean({ message: FIELD_MUST_BE_BOOLEAN_MESSAGE("impactsDamage") })
    impactsDamage!: boolean;

    @Validate(MeasureImpactProbabilityValidator)
    probability!: number | null;

    @Validate(MeasureImpactDamageValidator)
    damage!: number | null;
}

export class CreateMeasureImpactRequest extends UpdateMeasureImpactRequest {
    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("measureImpactId") })
    @IsInt({ message: FIELD_MUST_BE_INT_MESSAGE("measureImpactId") })
    measureId!: number;

    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("threatId") })
    @IsInt({ message: FIELD_MUST_BE_INT_MESSAGE("threatId") })
    threatId!: number;
}

export interface MeasureImpactResponse extends CreateMeasureImpactRequest {
    id: number;
    createdAt: string;
    updatedAt: string;
}
