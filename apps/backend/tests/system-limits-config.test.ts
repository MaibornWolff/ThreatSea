/**
 * Module that defines tests for the SYSTEM_MAX_ELEMENTS environment variable in #config/config.js.
 * The config module is a module-level singleton, so each test stubs the env var, resets the module
 * registry and re-imports it.
 */

afterEach(() => {
    vi.unstubAllEnvs();
});

async function importSystemMaxElements(): Promise<number> {
    vi.resetModules();
    return (await import("#config/config.js")).SYSTEM_MAX_ELEMENTS;
}

describe("SYSTEM_MAX_ELEMENTS", () => {
    it("defaults to 10000 when unset", async () => {
        vi.stubEnv("SYSTEM_MAX_ELEMENTS", undefined);

        expect(await importSystemMaxElements()).toBe(10_000);
    });

    it("defaults to 10000 when empty", async () => {
        vi.stubEnv("SYSTEM_MAX_ELEMENTS", "");

        expect(await importSystemMaxElements()).toBe(10_000);
    });

    it.each([
        ["1", 1],
        ["500", 500],
        ["65000", 65_000],
    ])("uses the configured value %s", async (rawValue, expected) => {
        vi.stubEnv("SYSTEM_MAX_ELEMENTS", rawValue);

        expect(await importSystemMaxElements()).toBe(expected);
    });

    it.each(["0", "-1", "1.5", "65001", "abc"])("rejects %s at startup", async (rawValue) => {
        vi.stubEnv("SYSTEM_MAX_ELEMENTS", rawValue);

        await expect(importSystemMaxElements()).rejects.toThrow(
            "Environment variable SYSTEM_MAX_ELEMENTS must be an integer between 1 and 65000"
        );
    });
});
