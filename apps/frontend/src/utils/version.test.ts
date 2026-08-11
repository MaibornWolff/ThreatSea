describe("version module", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.resetModules();
    });

    const importFresh = async () => {
        vi.resetModules();
        return await import("./version.ts");
    };

    it("falls back to 'local dev' when VITE_APP_VERSION is unset", async () => {
        vi.stubEnv("VITE_APP_VERSION", undefined);

        const { APP_VERSION } = await importFresh();

        expect(APP_VERSION).toBe("local dev");
    });

    it("falls back to 'local dev' when VITE_APP_VERSION is empty", async () => {
        vi.stubEnv("VITE_APP_VERSION", "");

        const { APP_VERSION } = await importFresh();

        expect(APP_VERSION).toBe("local dev");
    });

    it("exposes the injected version as-is, without a leading v", async () => {
        vi.stubEnv("VITE_APP_VERSION", "1.2.3-rc.4");

        const { APP_VERSION } = await importFresh();

        expect(APP_VERSION).toBe("1.2.3-rc.4");
    });
});
