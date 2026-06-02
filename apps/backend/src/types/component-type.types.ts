import { ProjectIdParam } from "#types/project.types.js";
import { POINTS_OF_ATTACK } from "./points-of-attack.types.js";
import { STANDARD_ICONS } from "./standard-icons.types.js";
import { Type } from "class-transformer";
import {
    ArrayMinSize,
    IsArray,
    IsDefined,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsString,
    Matches,
    MaxLength,
    Validate,
    ValidateIf,
    ValidationArguments,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from "class-validator";
import {
    ARRAY_NEEDS_MIN_ITEMS_MESSAGE,
    FIELD_MUST_BE_ARRAY_MESSAGE,
    FIELD_MUST_BE_ONE_OF_MESSAGE,
    FIELD_MUST_BE_STRING_MESSAGE,
    FIELD_MUST_BE_VALID_IMAGE_DATA,
    FIELD_MUST_EXIST_MESSAGE,
    MAX_NAME_LENGTH,
    MAX_SYMBOL_LENGTH,
    PARAM_MUST_BE_INT_MESSAGE,
    PARAM_MUST_EXIST_MESSAGE,
    STRING_MUST_NOT_BE_EMPTY_MESSAGE,
    STRING_TOO_LONG_MESSAGE,
} from "#middlewares/input-validations/validator-messages.js";
import { Trim } from "#middlewares/input-validations/trim.decorator.js";

export class ComponentTypeIdParam extends ProjectIdParam {
    @IsDefined({ message: PARAM_MUST_EXIST_MESSAGE("componentTypeId") })
    @Type(() => Number)
    @IsInt({ message: PARAM_MUST_BE_INT_MESSAGE("componentTypeId") })
    componentTypeId!: number;
}

@ValidatorConstraint({ name: "iconExactlyOne", async: false })
class IconExactlyOneConstraint implements ValidatorConstraintInterface {
    validate(_value: unknown, args: ValidationArguments): boolean {
        const object = args.object as CreateComponentTypeRequest;
        const hasSymbol = object.symbol != null;
        const hasStandardIcon = object.standardIcon != null;
        return hasSymbol !== hasStandardIcon;
    }

    defaultMessage(): string {
        return "Exactly one of symbol or standardIcon must be set";
    }
}

export class CreateComponentTypeRequest {
    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("name") })
    @IsString({ message: FIELD_MUST_BE_STRING_MESSAGE("name") })
    @Trim()
    @IsNotEmpty({ message: STRING_MUST_NOT_BE_EMPTY_MESSAGE("name") })
    @MaxLength(MAX_NAME_LENGTH, { message: STRING_TOO_LONG_MESSAGE("name", MAX_NAME_LENGTH) })
    @Validate(IconExactlyOneConstraint)
    name!: string;

    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("pointsOfAttack") })
    @IsArray({ message: FIELD_MUST_BE_ARRAY_MESSAGE("pointsOfAttack") })
    @ArrayMinSize(1, { message: ARRAY_NEEDS_MIN_ITEMS_MESSAGE("pointsOfAttack", 1) })
    @IsEnum(POINTS_OF_ATTACK, {
        each: true,
        message: FIELD_MUST_BE_ONE_OF_MESSAGE("pointsOfAttack", Object.values(POINTS_OF_ATTACK)),
    })
    pointsOfAttack!: POINTS_OF_ATTACK[];

    @ValidateIf((_, value) => value != null)
    @IsDefined({ message: FIELD_MUST_EXIST_MESSAGE("symbol") })
    @IsString({ message: FIELD_MUST_BE_STRING_MESSAGE("symbol", "or null") })
    @MaxLength(MAX_SYMBOL_LENGTH, { message: STRING_TOO_LONG_MESSAGE("symbol", MAX_SYMBOL_LENGTH) })
    @Matches(/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/, {
        message: FIELD_MUST_BE_VALID_IMAGE_DATA("symbol"),
    })
    symbol!: string | null;

    @ValidateIf((_, value) => value != null)
    @IsEnum(STANDARD_ICONS, {
        message: FIELD_MUST_BE_ONE_OF_MESSAGE("standardIcon", Object.values(STANDARD_ICONS)),
    })
    standardIcon!: STANDARD_ICONS | null;
}

export { CreateComponentTypeRequest as UpdateComponentTypeRequest };

export interface ComponentTypeResponse extends CreateComponentTypeRequest {
    id: number;
    projectId: number;
    createdAt: string;
    updatedAt: string;
}
