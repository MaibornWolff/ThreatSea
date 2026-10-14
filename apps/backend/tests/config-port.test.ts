/**
 * Module that defines tests for the PORT and DATABASE_PORT validation in #config/config.js.
 * Because that module is a module-level singleton, each test stubs env vars, resets the
 * module registry, and re-imports it fresh.
 */

afterEach(() => {
    vi.unstubAllEnvs();
});

async function importConfig(): Promise<typeof import("#config/config.js")> {
    vi.resetModules();
    return import("#config/config.js");
}

describe("port configuration", () => {
    it("uses the defaults when PORT and DATABASE_PORT are unset", async () => {
        vi.stubEnv("PORT", undefined);
        vi.stubEnv("DATABASE_PORT", undefined);

        const config = await importConfig();

        expect(config.PORT).toBe(8000);
        expect(config.databaseConfig.port).toBe(5432);
    });

    it("accepts the highest valid port", async () => {
        vi.stubEnv("PORT", "65535");

        const config = await importConfig();

        expect(config.PORT).toBe(65535);
    });

    it.each(["0", "65536", "1.5", "abc"])("rejects PORT=%s", async (value) => {
        vi.stubEnv("PORT", value);

        await expect(importConfig()).rejects.toThrow("Environment variable PORT ");
    });

    it.each(["0", "65536", "1.5", "abc"])("rejects DATABASE_PORT=%s", async (value) => {
        vi.stubEnv("DATABASE_PORT", value);

        await expect(importConfig()).rejects.toThrow("Environment variable DATABASE_PORT ");
    });
});
