/**
 * Module that defines tests for where and how request bodies are parsed.
 */
import { gzipSync } from "node:zlib";
import request from "supertest";
import { db } from "#db/index.js";
import { catalogs, usersCatalogs } from "#db/schema.js";
import { app } from "#server.js";
import { LANGUAGES } from "#types/languages.type.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import VALID_TEST_PROJECT from "./testData/testData.json" with { type: "json" };

const MEGABYTE = 1024 * 1024;

let cookies: string[];
let csrfToken: string;
let catalogId: number;
let projectId: number;

function jsonOfSize(bytes: number): string {
    return JSON.stringify({ padding: "a".repeat(bytes) });
}

beforeAll(async () => {
    const csrfResponse = await request(app).get("/api/csrf-token");
    csrfToken = csrfResponse.body.token;
    const setCookieHeader = csrfResponse.headers["set-cookie"];
    cookies = [...(setCookieHeader !== undefined ? [setCookieHeader] : []), "accessToken=fakeaccessToken"].flat();

    const userId = (await request(app).get("/api/auth/status").set("Cookie", cookies)).body.data.userId;
    catalogId = (await db.insert(catalogs).values({ name: "Body limits", language: LANGUAGES.EN }).returning()).at(
        0
    )!.id;
    await db.insert(usersCatalogs).values({ userId, catalogId, role: USER_ROLES.OWNER });
    projectId = (
        await request(app)
            .post("/api/projects")
            .send({ name: "Body limits", description: "x", catalogId, confidentialityLevel: "INTERNAL" })
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies)
    ).body.id;
});

describe("request bodies", () => {
    it("are not parsed before authentication", async () => {
        const response = await request(app)
            .post("/api/projects")
            .set("Content-Type", "application/json")
            .set("X-CSRF-TOKEN", csrfToken)
            .set(
                "Cookie",
                cookies.filter((cookie) => !cookie.startsWith("accessToken="))
            )
            .send("{malformed");

        expect(response.status).toBe(401);
    });

    it("are rejected above 1 MB on regular routes", async () => {
        const response = await request(app)
            .post("/api/projects")
            .set("Content-Type", "application/json")
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies)
            .send(jsonOfSize(1.5 * MEGABYTE));

        expect(response.status).toBe(413);
    });

    it("may be larger than 1 MB when saving a system", async () => {
        const image = `data:image/png;base64,${"A".repeat(5 * MEGABYTE)}`;
        const response = await request(app)
            .put(`/api/projects/${projectId}/system`)
            .send({ data: null, image })
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);

        expect(response.status).toBe(200);
    });

    it("are rejected above 10 MB when saving a system", async () => {
        const response = await request(app)
            .put(`/api/projects/${projectId}/system`)
            .set("Content-Type", "application/json")
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies)
            .send(jsonOfSize(11 * MEGABYTE));

        expect(response.status).toBe(413);
    });

    it("may be larger than 1 MB when importing catalog threats", async () => {
        const response = await request(app)
            .post(`/api/catalogs/${catalogId}/threats/import`)
            .set("Content-Type", "application/json")
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies)
            .send(JSON.stringify([{ padding: "a".repeat(1.5 * MEGABYTE) }]));

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Validation Error");
    });

    it("may be larger than 10 MB when importing a project", async () => {
        const project = JSON.parse(JSON.stringify(VALID_TEST_PROJECT));
        project.project.name = "Large import";
        project.system.image = `data:image/png;base64,${"A".repeat(12 * MEGABYTE)}`;

        const response = await request(app)
            .post("/api/import")
            .send(project)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);

        expect(response.status).toBe(204);
    });

    it("are not decompressed", async () => {
        const response = await request(app)
            .post("/api/projects")
            .set("Content-Type", "application/json")
            .set("Content-Encoding", "gzip")
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies)
            // Send the compressed bytes as they are instead of letting superagent serialize the Buffer.
            .serialize((body) => body)
            .send(
                gzipSync(
                    JSON.stringify({
                        name: "Compressed",
                        description: "x",
                        catalogId,
                        confidentialityLevel: "INTERNAL",
                    })
                )
            );

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Invalid request");
    });
});
