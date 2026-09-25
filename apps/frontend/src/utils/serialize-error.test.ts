import { toSerializedError } from "./serialize-error";

describe("toSerializedError", () => {
    it("keeps name and message from Error instances", () => {
        const error = new Error("boom");
        error.name = "ValidationError";

        expect(toSerializedError(error)).toEqual({ name: "ValidationError", message: "boom" });
    });

    it("preserves the message of object-like values", () => {
        expect(toSerializedError({ message: "Request failed" })).toEqual({ message: "Request failed" });
    });

    it("stringifies objects without a string message", () => {
        expect(toSerializedError({ message: 42 })).toEqual({ message: "[object Object]" });
        expect(toSerializedError({ code: 500 })).toEqual({ message: "[object Object]" });
    });

    it("stringifies primitives", () => {
        expect(toSerializedError("plain string")).toEqual({ message: "plain string" });
        expect(toSerializedError(null)).toEqual({ message: "null" });
        expect(toSerializedError(undefined)).toEqual({ message: "undefined" });
    });
});
