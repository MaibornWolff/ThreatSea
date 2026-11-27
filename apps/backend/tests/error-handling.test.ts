/**
 * Module that defines tests for the global error handling.
 */
import type { Request, Response } from "express";
import request from "supertest";
import { DrizzleQueryError } from "drizzle-orm/errors";
import { DatabaseError } from "pg";
import { db } from "#db/index.js";
import { catalogs, usersCatalogs } from "#db/schema.js";
import { app } from "#server.js";
import { ErrorHandler } from "#middlewares/error.middleware.js";
import { LANGUAGES } from "#types/languages.type.js";
import { USER_ROLES } from "#types/user-roles.types.js";

let cookies: string[];
let csrfToken: string;
let userId: number;
let catalogId: number;
let projectId: number;

beforeAll(async () => {
    const csrfResponse = await request(app).get("/api/csrf-token");
    csrfToken = csrfResponse.body.token;
    const setCookieHeader = csrfResponse.headers["set-cookie"];
    cookies = [...(setCookieHeader !== undefined ? [setCookieHeader] : []), "accessToken=fakeaccessToken"].flat();

    userId = (await request(app).get("/api/auth/status").set("Cookie", cookies)).body.data.userId;
    catalogId = (await db.insert(catalogs).values({ name: "Error handling", language: LANGUAGES.EN }).returning()).at(
        0
    )!.id;
    await db.insert(usersCatalogs).values({ userId, catalogId, role: USER_ROLES.OWNER });
    projectId = (
        await request(app)
            .post("/api/projects")
            .send({ name: "Error handling", description: "x", catalogId, confidentialityLevel: "INTERNAL" })
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies)
    ).body.id;
});

function expectNoInternals(body: unknown): void {
    const serialized = JSON.stringify(body);
    expect(serialized).not.toMatch(/Failed query|JSON at position|ENOENT|entity too large|select |delete from/i);
}

describe("client errors are not reported as 500", () => {
    it("answers malformed JSON with 400", async () => {
        const response = await request(app)
            .post("/api/projects")
            .set("Content-Type", "application/json")
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies)
            .send("{malformed");

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ type: "Bad Request", message: "Invalid request", code: null });
    });

    it("answers an oversized body with 413", async () => {
        const response = await request(app)
            .post("/api/projects")
            .set("Content-Type", "application/json")
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies)
            .send(JSON.stringify({ padding: "a".repeat(2 * 1024 * 1024) }));

        expect(response.status).toBe(413);
        expect(response.body).toEqual({ type: "Payload Too Large", message: "Request body is too large", code: null });
    });

    it("answers deleting a catalog that a project uses with 409", async () => {
        const response = await request(app)
            .delete(`/api/catalogs/${catalogId}`)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);

        expect(response.status).toBe(409);
        expect(response.body.message).toBe("The resource is still referenced by other data");
        expectNoInternals(response.body);
    });

    it("answers a reference to a missing catalog measure with 400", async () => {
        const response = await request(app)
            .post(`/api/projects/${projectId}/system/measures`)
            .send({ name: "Measure", description: "x", scheduledAt: "2025-01-01", catalogMeasureId: 999_999_999 })
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("A referenced resource does not exist");
        expectNoInternals(response.body);
    });

    it("answers demoting the last project owner with 409", async () => {
        const response = await request(app)
            .put(`/api/projects/${projectId}/members/${userId}`)
            .send({ role: USER_ROLES.VIEWER })
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);

        expect(response.status).toBe(409);
        expect(response.body.message).toBe(
            "Cannot change role of user, this would leave the project without an owner."
        );
    });

    it("answers removing the last project owner with 409", async () => {
        const response = await request(app)
            .delete(`/api/projects/${projectId}/members/${userId}`)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);

        expect(response.status).toBe(409);
        expect(response.body.message).toBe("Cannot delete user, this would leave the project without an owner.");
    });

    it("answers an unknown API path with a JSON 404 instead of the app", async () => {
        const response = await request(app).get("/api/does-not-exist").set("Cookie", cookies);

        expect(response.status).toBe(404);
        expect(response.headers["content-type"]).toContain("application/json");
        expect(response.body).toEqual({ type: "Not Found", message: "Unknown API endpoint", code: null });
    });
});

describe("ErrorHandler", () => {
    function handle(error: Error): { status: number; body: Record<string, unknown> } {
        const result = { status: 0, body: {} as Record<string, unknown> };
        const response = {
            status(status: number) {
                result.status = status;
                return this;
            },
            json(body: Record<string, unknown>) {
                result.body = body;
                return this;
            },
        } as unknown as Response;
        ErrorHandler(error, {} as Request, response, vi.fn());
        return result;
    }

    function databaseError(code: string, query = 'insert into "assets" values ($1)'): Error {
        const cause = new DatabaseError("secret database detail", 0, "error");
        cause.code = code;
        return new DrizzleQueryError(query, [], cause);
    }

    it("hides the message of an unexpected error and returns a log id", () => {
        const { status, body } = handle(new Error("secret internal detail"));

        expect(status).toBe(500);
        expect(body["message"]).toBe("Unexpected Error");
        expect(body["logId"]).toEqual(expect.any(String));
        expect(JSON.stringify(body)).not.toContain("secret internal detail");
    });

    it.each([
        ["23505", 409, "A resource with these values already exists"],
        ["23001", 409, "The resource is still referenced by other data"],
        ["23503", 400, "A referenced resource does not exist"],
        ["23514", 400, "Invalid value"],
        ["22P02", 400, "Invalid value"],
        ["22001", 400, "Invalid value"],
    ])("maps database error %s to %i", (code, expectedStatus, expectedMessage) => {
        const { status, body } = handle(databaseError(code));

        expect(status).toBe(expectedStatus);
        expect(body["message"]).toBe(expectedMessage);
        expect(JSON.stringify(body)).not.toContain("secret database detail");
    });

    it("maps a foreign key violation on delete to 409", () => {
        const { status } = handle(databaseError("23503", 'delete from "catalogs" where "catalogs"."id" = $1'));

        expect(status).toBe(409);
    });

    it("keeps other database errors unexpected without exposing them", () => {
        const { status, body } = handle(databaseError("40P01"));

        expect(status).toBe(500);
        expect(JSON.stringify(body)).not.toContain("secret database detail");
        expect(JSON.stringify(body)).not.toContain("insert into");
    });
});
