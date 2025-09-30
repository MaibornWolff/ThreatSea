import { ValidationError } from "class-validator";

/**
 * Generates a number array containing all allowed values
 * for the tolerance slider of the risk matrix
 */
const LINE_OF_TOLERANCE_VALUES = (() => {
    const valuesSet = new Set<number>();
    for (let i = 1; i < 6; i++) {
        for (let j = i; j < 6; j++) {
            valuesSet.add(i * j);
        }
    }
    return [...valuesSet];
})();

export const MAX_NAME_LENGTH = 255;
export const MAX_DESCRIPTION_LENGTH = 65535;
export const CIA_VALUE_MIN = 1;
export const CIA_VALUE_MAX = 5;
export const PROBABILITY_VALUE_MIN = 1;
export const PROBABILITY_VALUE_MAX = 5;
export const DAMAGE_VALUE_MIN = 1;
export const DAMAGE_VALUE_MAX = 5;
export const LINE_OF_TOLERANCE_GREEN_VALUES = [...LINE_OF_TOLERANCE_VALUES, 0];
export const LINE_OF_TOLERANCE_RED_VALUES = [...LINE_OF_TOLERANCE_VALUES, 26];

export const PARAM_MUST_EXIST_MESSAGE = (param: string, condition?: string) => {
    return `Parameter ${param} must exist${condition ? `${condition}` : ""}`;
};

export const PARAM_MUST_BE_INT_MESSAGE = (param: string, condition?: string) => {
    return `Parameter ${param} must be an integer${condition ? `${condition}` : ""}`;
};

export const FIELD_MUST_EXIST_MESSAGE = (field: string, condition?: string) => {
    return `Field ${field} must exist${condition ? `${condition}` : ""}`;
};

export const FIELD_MUST_BE_BOOLEAN_MESSAGE = (field: string, condition?: string) => {
    return `Field ${field} must be a boolean${condition ? `${condition}` : ""}`;
};

export const FIELD_MUST_BE_BOOLEAN_VALUE_MESSAGE = (field: string, value: boolean, condition?: string) => {
    return `Field ${field} must be ${value ? "true" : "false"}${condition ? ` ${condition}` : ""}`;
};

export const FIELD_MUST_BE_NULL_MESSAGE = (field: string, condition?: string) => {
    return `Field ${field} must be null${condition ? ` ${condition}` : ""}`;
};

export const FIELD_MUST_BE_STRING_MESSAGE = (field: string, condition?: string) => {
    return `Field ${field} must be a string${condition ? ` ${condition}` : ""}`;
};

export const FIELD_MUST_BE_ARRAY_MESSAGE = (field: string, condition?: string) => {
    return `Field ${field} must be an array${condition ? ` ${condition}` : ""}`;
};

export const FIELD_MUST_BE_INT_MESSAGE = (field: string, condition?: string) => {
    return `Field ${field} must be an integer${condition ? ` ${condition}` : ""}`;
};

export const FIELD_MUST_BE_ISO_8601_DATE = (field: string, condition?: string) => {
    return `Field ${field} must be an ISO-8601 formatted date${condition ? ` ${condition}` : ""}`;
};

export const FIELD_MUST_BE_VALID_IMAGE_DATA = (field: string, condition?: string) => {
    return `Field ${field} must be a valid base64-encoded PNG or JPEG${condition ? ` ${condition}` : ""}`;
};

export const FIELD_MUST_BE_ONE_OF_MESSAGE = (field: string, values: unknown[]) => {
    return `Field ${field} must be one of these values: ${values.join(", ")}`;
};

export const STRING_MUST_NOT_BE_EMPTY_MESSAGE = (field: string) => {
    return `Field ${field} must not be empty`;
};

export const STRING_TOO_LONG_MESSAGE = (field: string, maxLength: number) => {
    return `Field ${field} may be at most ${maxLength} characters long`;
};

export const INT_MUST_BE_BETWEEN_MESSAGE = (field: string, min: number, max: number) => {
    return `Field ${field} must be between ${min} and ${max}`;
};

export const ARRAY_NEEDS_MIN_ITEMS_MESSAGE = (field: string, minItems: number) => {
    return `Field ${field} array needs at least ${minItems} items`;
};

export const INVALID_LINES_OF_TOLERANCE_RATIO_MESSAGE = () => {
    return "lineOfToleranceGreen must be less or equal than lineOfToleranceRed";
};

export function formatValidationErrors(errors: ValidationError[]): string[] {
    return errors.flatMap((error) => (error.constraints ? Object.values(error.constraints) : []));
}
