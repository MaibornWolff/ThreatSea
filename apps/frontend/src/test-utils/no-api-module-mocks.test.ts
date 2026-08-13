/**
 * @module no-api-module-mocks - Guards the "no vi.mock on #api/ modules" rule.
 *
 * The suite runs with `isolate: false`, so all test files share one module
 * cache. Every API module is reachable from store.ts (actions → middlewares),
 * which means an earlier store-rendering test file caches the real actions
 * module whose thunks close over the real API. A later `vi.mock` of that API
 * module never reaches the cached closure: the test silently issues real
 * network requests and passes or fails depending on file execution order.
 *
 * Use `vi.spyOn(SomeAPI, "method")` instead — it patches the shared module
 * object itself, so the cached thunk sees it in every order. See the Testing
 * section of AGENTS.md and use-report.hook.test.tsx for the pattern.
 */

// Raw sources of every test file, resolved by Vite at transform time — no
// filesystem access or node types needed.
const testSources = import.meta.glob("/src/**/*.{test,spec}.{ts,tsx}", {
    query: "?raw",
    import: "default",
    eager: true,
}) as Record<string, string>;

// Built from parts so this file's own source does not match the pattern.
const FORBIDDEN_MOCK = new RegExp(String.raw`vi\.mock\(\s*["'` + "`]" + "#api/");

const SELF = "/src/test-utils/no-api-module-mocks.test.ts";

// Assembled at runtime for the same reason the pattern is.
const mockCall = (quote: string, specifier: string) => "vi.mock(" + quote + specifier + quote + ")";

describe("test-suite conventions", () => {
    it("detects vi.mock of #api/ modules across quote styles", () => {
        expect(FORBIDDEN_MOCK.test(mockCall('"', "#api/threats.api.ts"))).toBe(true);
        expect(FORBIDDEN_MOCK.test(mockCall("'", "#api/threats.api.ts"))).toBe(true);
        expect(FORBIDDEN_MOCK.test(mockCall("`", "#api/threats.api.ts"))).toBe(true);
        expect(FORBIDDEN_MOCK.test("vi.mock(\n    " + '"#api/threats.api.ts")')).toBe(true);

        expect(FORBIDDEN_MOCK.test(mockCall('"', "react"))).toBe(false);
        expect(FORBIDDEN_MOCK.test('vi.spyOn(ThreatsAPI, "getThreats")')).toBe(false);
        expect(FORBIDDEN_MOCK.test('import { ThreatsAPI } from "#api/threats.api.ts";')).toBe(false);
    });

    it("no test file module-mocks an #api/ module (use vi.spyOn on the real module instead)", () => {
        const offenders = Object.entries(testSources)
            .filter(([filePath, source]) => filePath !== SELF && FORBIDDEN_MOCK.test(source))
            .map(([filePath]) => filePath);

        expect(
            offenders,
            `These test files use vi.mock on an #api/ module, which is order-dependent under isolate: false ` +
                `and can silently hit the real network. Use vi.spyOn(SomeAPI, "method") on the real module ` +
                `instead — see the Testing section of AGENTS.md.`
        ).toEqual([]);
    });
});
