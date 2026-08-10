import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import {
    FIELD_MUST_BE_VALID_IMAGE_DATA,
    formatValidationErrors,
} from "#middlewares/input-validations/validator-messages.js";
import { UpdateSystemRequestDto } from "#types/system.types.js";

describe("formatValidationErrors", () => {
    it("includes messages from nested validation errors with their property path", async () => {
        const body = {
            data: {
                components: [
                    { symbol: "/static/media/user.4176f8c5.png" },
                    { symbol: "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=" },
                ],
            },
        };
        const instance = plainToInstance(UpdateSystemRequestDto, body, { enableImplicitConversion: true });

        const errors = await validate(instance, { whitelist: false });
        const messages = formatValidationErrors(errors);

        expect(messages).toEqual([`data.components.1.symbol: ${FIELD_MUST_BE_VALID_IMAGE_DATA("symbol")}`]);
    });
});
