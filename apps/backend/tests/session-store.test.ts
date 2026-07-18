import request from "supertest";
import { app } from "#server.js";
import { db } from "#db/index.js";
import { sessions } from "#db/schema.js";

describe("persistent session store", () => {
    it("persists the session to postgres", async () => {
        const csrfTokenResponse = await request(app).get("/api/csrf-token");
        expect(csrfTokenResponse.status).toBe(200);
        expect(csrfTokenResponse.body.token).toBeTypeOf("string");

        await vi.waitFor(async () => {
            const storedSessions = await db.select().from(sessions);
            expect(storedSessions.length).toBeGreaterThan(0);
        });
    });
});
