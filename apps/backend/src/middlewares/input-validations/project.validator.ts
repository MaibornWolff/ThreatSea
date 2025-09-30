import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import { INVALID_LINES_OF_TOLERANCE_RATIO_MESSAGE } from "#middlewares/input-validations/validator-messages.js";

@ValidatorConstraint({ name: "projectLinesOfToleranceValidator", async: false })
export class ProjectLinesOfToleranceValidator implements ValidatorConstraintInterface {
    private lastError: string | null = null;

    validate(_: unknown, validationArguments?: ValidationArguments): Promise<boolean> | boolean {
        const obj = validationArguments?.object;
        if (obj === undefined) {
            return false;
        }

        if (!("lineOfToleranceGreen" in obj) || !("lineOfToleranceRed" in obj)) {
            return false;
        }

        const { lineOfToleranceGreen, lineOfToleranceRed } = obj;

        if (typeof lineOfToleranceGreen !== "number" || typeof lineOfToleranceRed !== "number") {
            return false;
        }

        if (lineOfToleranceGreen > lineOfToleranceRed) {
            this.lastError = INVALID_LINES_OF_TOLERANCE_RATIO_MESSAGE();
            return false;
        }

        return true;
    }

    defaultMessage(_?: ValidationArguments): string {
        return (
            this.lastError ??
            "Field lineOfToleranceGreen or lineOfToleranceRed does not meet requirements for validation"
        );
    }
}
