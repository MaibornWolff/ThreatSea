import { getDatabaseTlsConfig } from "#config/config.js";

describe("getDatabaseTlsConfig", () => {
    it("verifies the server certificate when DATABASE_TLS is unset", () => {
        expect(getDatabaseTlsConfig(undefined)).toBe(true);
    });

    it("verifies the server certificate for an unknown value", () => {
        expect(getDatabaseTlsConfig("no_verify")).toBe(true);
    });

    it("turns TLS off when DATABASE_TLS is disabled", () => {
        expect(getDatabaseTlsConfig("disabled")).toBe(false);
    });

    it("encrypts without certificate verification when DATABASE_TLS is no-verify", () => {
        expect(getDatabaseTlsConfig("no-verify")).toEqual({ rejectUnauthorized: false });
    });
});
