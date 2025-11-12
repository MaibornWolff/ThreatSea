import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import {
    DAMAGE_VALUE_MAX,
    DAMAGE_VALUE_MIN,
    FIELD_MUST_BE_BOOLEAN_VALUE_MESSAGE,
    FIELD_MUST_BE_INT_MESSAGE,
    FIELD_MUST_BE_NULL_MESSAGE,
    FIELD_MUST_EXIST_MESSAGE,
    INT_MUST_BE_BETWEEN_MESSAGE,
    PROBABILITY_VALUE_MAX,
    PROBABILITY_VALUE_MIN,
} from "#middlewares/input-validations/validator-messages.js";

@ValidatorConstraint({ name: "measureImpactProbabilityValidator", async: false })
export class MeasureImpactProbabilityValidator implements ValidatorConstraintInterface {
    private lastError: string | null = null;

    validate(probability: unknown, validationArguments?: ValidationArguments): Promise<boolean> | boolean {
        const obj = validationArguments?.object;
        if (obj === undefined) {
            return false;
        }

        if (probability === undefined) {
            this.lastError = FIELD_MUST_EXIST_MESSAGE("probability");
            return false;
        }

        if (probability != null && typeof probability !== "number") {
            this.lastError = FIELD_MUST_BE_INT_MESSAGE(
                "probability",
                "or null if setsOutOfScope or not impacts probability"
            );
            return false;
        }

        if (!("impactsProbability" in obj) || !("setsOutOfScope" in obj)) {
            return false;
        }

        const { impactsProbability, setsOutOfScope } = obj;

        if (typeof setsOutOfScope !== "boolean" || typeof impactsProbability !== "boolean") {
            return false;
        }

        if (setsOutOfScope && impactsProbability) {
            this.lastError = FIELD_MUST_BE_BOOLEAN_VALUE_MESSAGE(
                "impactsProbability",
                false,
                "when threat is set out of scope"
            );
            return false;
        }

        if (setsOutOfScope && probability != null) {
            this.lastError = FIELD_MUST_BE_NULL_MESSAGE("probability", "when threat is set out of scope");
            return false;
        }

        if (!setsOutOfScope && impactsProbability) {
            if (typeof probability !== "number" || !Number.isInteger(probability)) {
                this.lastError = FIELD_MUST_BE_INT_MESSAGE("probability", "when impactsProbability is true");
                return false;
            }
            if (probability < PROBABILITY_VALUE_MIN || probability > PROBABILITY_VALUE_MAX) {
                this.lastError = INT_MUST_BE_BETWEEN_MESSAGE(
                    "probability",
                    PROBABILITY_VALUE_MIN,
                    PROBABILITY_VALUE_MAX
                );
                return false;
            }
        }

        if (!setsOutOfScope && !impactsProbability && probability != null) {
            this.lastError = FIELD_MUST_BE_NULL_MESSAGE("probability", "when impactsProbability is false");
            return false;
        }

        return true;
    }

    defaultMessage(_?: ValidationArguments): string {
        return (
            this.lastError ??
            "Field probability, impactsProbability or setsOutOfScope does not meet requirements for validation"
        );
    }
}

@ValidatorConstraint({ name: "measureImpactDamageValidator", async: false })
export class MeasureImpactDamageValidator implements ValidatorConstraintInterface {
    private lastError: string | null = null;

    validate(damage: unknown, validationArguments?: ValidationArguments): Promise<boolean> | boolean {
        const obj = validationArguments?.object;
        if (obj === undefined) {
            return false;
        }

        if (damage === undefined) {
            this.lastError = FIELD_MUST_EXIST_MESSAGE("damage");
            return false;
        }

        if (damage != null && typeof damage !== "number") {
            this.lastError = FIELD_MUST_BE_INT_MESSAGE("damage", "or null if setsOutOfScope or not impacts damage");
            return false;
        }

        if (!("impactsDamage" in obj) || !("setsOutOfScope" in obj)) {
            return false;
        }

        const { impactsDamage, setsOutOfScope } = obj;

        if (typeof setsOutOfScope !== "boolean" || typeof impactsDamage !== "boolean") {
            return false;
        }

        if (setsOutOfScope && impactsDamage) {
            this.lastError = FIELD_MUST_BE_BOOLEAN_VALUE_MESSAGE(
                "impactsDamage",
                false,
                "when threat is set out of scope"
            );
            return false;
        }

        if (setsOutOfScope && damage != null) {
            this.lastError = FIELD_MUST_BE_NULL_MESSAGE("damage", "when threat is set out of scope");
            return false;
        }

        if (!setsOutOfScope && impactsDamage) {
            if (typeof damage !== "number" || !Number.isInteger(damage)) {
                this.lastError = FIELD_MUST_BE_INT_MESSAGE("damage", "when impactsDamage is true");
                return false;
            }
            if (damage < DAMAGE_VALUE_MIN || damage > DAMAGE_VALUE_MAX) {
                this.lastError = INT_MUST_BE_BETWEEN_MESSAGE("damage", DAMAGE_VALUE_MIN, DAMAGE_VALUE_MAX);
                return false;
            }
        }

        if (!setsOutOfScope && !impactsDamage && damage != null) {
            this.lastError = FIELD_MUST_BE_NULL_MESSAGE("damage", "when impactsDamage is false");
            return false;
        }

        return true;
    }

    defaultMessage(_?: ValidationArguments): string {
        return (
            this.lastError ?? "Field damage, impactsDamage or setsOutOfScope does not meet requirements for validation"
        );
    }
}
