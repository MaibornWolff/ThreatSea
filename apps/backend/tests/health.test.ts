import request from "supertest";
import { app } from "#server.js";

describe("GET /api/health", () => {
    it("returns ok with a no-store cache directive", async () => {
        const res = await request(app).get("/api/health");

        expect(res.status).toBe(200);
        expect(res.body).toEqual(expect.objectContaining({ ok: true }));
        expect(res.headers["cache-control"]).toBe("no-store");
    });
});
