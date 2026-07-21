/// <reference types="vitest/globals" />

/**
 * Module that defines tests for the user lifecycle environment variable validation
 * in #config/config.js. Because that module is a module-level singleton, each test
 * stubs env vars, resets the module registry, and re-imports it fresh.
 */

afterEach(() => {
    vi.unstubAllEnvs();
});

async function importUserLifecycleConfig(): Promise<typeof import("#config/config.js").userLifecycleConfig> {
    vi.resetModules();
    const configModule = await import("#config/config.js");
    return configModule.userLifecycleConfig;
}

describe("userLifecycleConfig", () => {
    it("uses defaults when the lifecycle env vars are unset", async () => {
        vi.stubEnv("USER_PURGE_ENABLED", undefined);
        vi.stubEnv("USER_HIDE_THRESHOLD_DAYS", undefined);
        vi.stubEnv("USER_PURGE_THRESHOLD_DAYS", undefined);
        vi.stubEnv("USER_PURGE_INTERVAL_HOURS", undefined);

        const userLifecycleConfig = await importUserLifecycleConfig();

        expect(userLifecycleConfig).toEqual({
            purgeEnabled: false,
            hideThresholdDays: 90,
            purgeThresholdDays: 365,
            purgeIntervalHours: 24,
        });
    });

    it("respects valid custom values", async () => {
        vi.stubEnv("USER_PURGE_ENABLED", "true");
        vi.stubEnv("USER_HIDE_THRESHOLD_DAYS", "30");
        vi.stubEnv("USER_PURGE_THRESHOLD_DAYS", "180");
        vi.stubEnv("USER_PURGE_INTERVAL_HOURS", "12");

        const userLifecycleConfig = await importUserLifecycleConfig();

        expect(userLifecycleConfig).toEqual({
            purgeEnabled: true,
            hideThresholdDays: 30,
            purgeThresholdDays: 180,
            purgeIntervalHours: 12,
        });
    });

    it("throws with the variable name when USER_HIDE_THRESHOLD_DAYS is non-numeric", async () => {
        vi.stubEnv("USER_HIDE_THRESHOLD_DAYS", "abc");

        await expect(importUserLifecycleConfig()).rejects.toThrow("USER_HIDE_THRESHOLD_DAYS");
    });

    it("throws when USER_PURGE_THRESHOLD_DAYS is negative", async () => {
        vi.stubEnv("USER_PURGE_THRESHOLD_DAYS", "-1");

        await expect(importUserLifecycleConfig()).rejects.toThrow("USER_PURGE_THRESHOLD_DAYS");
    });

    it("throws when USER_PURGE_INTERVAL_HOURS is zero", async () => {
        vi.stubEnv("USER_PURGE_INTERVAL_HOURS", "0");

        await expect(importUserLifecycleConfig()).rejects.toThrow("USER_PURGE_INTERVAL_HOURS");
    });

    it("throws when USER_PURGE_INTERVAL_HOURS exceeds the setInterval overflow limit", async () => {
        vi.stubEnv("USER_PURGE_INTERVAL_HOURS", "597");

        await expect(importUserLifecycleConfig()).rejects.toThrow("USER_PURGE_INTERVAL_HOURS");
    });

    it("throws when USER_HIDE_THRESHOLD_DAYS is not below USER_PURGE_THRESHOLD_DAYS", async () => {
        vi.stubEnv("USER_HIDE_THRESHOLD_DAYS", "400");
        vi.stubEnv("USER_PURGE_THRESHOLD_DAYS", "365");

        await expect(importUserLifecycleConfig()).rejects.toThrow("USER_HIDE_THRESHOLD_DAYS");
    });

    it("leaves purgeEnabled false for any value other than 'true'", async () => {
        vi.stubEnv("USER_PURGE_ENABLED", "1");

        const userLifecycleConfig = await importUserLifecycleConfig();

        expect(userLifecycleConfig.purgeEnabled).toBe(false);
    });
});
