import { validateOidcScope } from "#config/config.js";

describe("validateOidcScope", () => {
    it("returns the scope unchanged when it contains openid", () => {
        expect(validateOidcScope("openid profile email")).toBe("openid profile email");
    });

    it("accepts openid in any position", () => {
        expect(validateOidcScope("profile openid email")).toBe("profile openid email");
    });

    it("throws when the openid scope is missing", () => {
        expect(() => validateOidcScope("profile email")).toThrow(/openid/);
    });

    it("does not treat a substring as the openid scope", () => {
        expect(() => validateOidcScope("openidconnect profile")).toThrow(/openid/);
    });
});
