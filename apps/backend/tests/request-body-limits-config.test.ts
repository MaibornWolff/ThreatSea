/**
 * Module that defines tests for the PROJECT_IMPORT_MAX_BODY_SIZE_MB environment variable in
 * #config/config.js. The config module is a module-level singleton, so each test stubs the env var,
 * resets the module registry and re-imports it.
 */

afterEach(() => {
    vi.unstubAllEnvs();
});

async function importRequestBodyLimits(): Promise<typeof import("#config/config.js").requestBodyLimits> {
    vi.resetModules();
    return (await import("#config/config.js")).requestBodyLimits;
}

describe("requestBodyLimits", () => {
    it("uses the defaults when PROJECT_IMPORT_MAX_BODY_SIZE_MB is unset", async () => {
        vi.stubEnv("PROJECT_IMPORT_MAX_BODY_SIZE_MB", undefined);

        expect(await importRequestBodyLimits()).toEqual({
            default: "1mb",
            catalogImport: "2mb",
            systemSave: "10mb",
            projectImport: "50mb",
        });
    });

    it("uses the configured project import limit", async () => {
        vi.stubEnv("PROJECT_IMPORT_MAX_BODY_SIZE_MB", "120");

        expect((await importRequestBodyLimits()).projectImport).toBe("120mb");
    });

    it.each(["0", "-5", "abc"])("rejects %s at startup", async (rawValue) => {
        vi.stubEnv("PROJECT_IMPORT_MAX_BODY_SIZE_MB", rawValue);

        await expect(importRequestBodyLimits()).rejects.toThrow(
            "Environment variable PROJECT_IMPORT_MAX_BODY_SIZE_MB must be a positive number"
        );
    });
});
