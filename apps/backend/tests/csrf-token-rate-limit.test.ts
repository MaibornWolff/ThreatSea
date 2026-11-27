/**
 * Module that defines tests for the rate limit on CSRF token requests. Each request without a session
 * cookie would otherwise store a new session row.
 */
import request from "supertest";
import { csrfTokenRateLimitConfig } from "#config/config.js";

const TEST_LIMIT = 2;

async function importAppWithCsrfTokenLimit(limit: number) {
    vi.resetModules();
    vi.doMock("#config/config.js", async (importOriginal) => {
        const original = await importOriginal<typeof import("#config/config.js")>();
        return { ...original, csrfTokenRateLimitConfig: { ...original.csrfTokenRateLimitConfig, max: limit } };
    });
    return (await import("#server.js")).app;
}

afterEach(() => {
    vi.doUnmock("#config/config.js");
    vi.resetModules();
});

describe("GET /api/csrf-token", () => {
    it("reports the configured rate limit", async () => {
        const { app } = await import("#server.js");

        const response = await request(app).get("/api/csrf-token");

        expect(response.status).toBe(200);
        expect(response.headers["ratelimit-limit"]).toBe(String(csrfTokenRateLimitConfig.max));
    });

    it("rejects requests above the limit without storing another session", async () => {
        const app = await importAppWithCsrfTokenLimit(TEST_LIMIT);

        const responses: request.Response[] = [];
        for (let attempt = 0; attempt < TEST_LIMIT + 2; attempt++) {
            responses.push(await request(app).get("/api/csrf-token"));
        }

        expect(responses.map((response) => response.status)).toEqual([200, 200, 429, 429]);
        // express-session sets the cookie only when it stores the session (saveUninitialized: false).
        expect(responses.map((response) => response.headers["set-cookie"] !== undefined)).toEqual([
            true,
            true,
            false,
            false,
        ]);
    });
});
