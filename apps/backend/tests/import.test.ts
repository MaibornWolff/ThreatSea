/**
 * Module that defines tests for the import.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "#server.js";
import VALID_TEST_PROJECT_SMALL from "./testData/testDataSmall.json" with { type: "json" };
import VALID_TEST_PROJECT from "./testData/testData.json" with { type: "json" };
import VALID_TEST_PROJECT_1 from "./testData/testDataWithConnection.json" with { type: "json" };
import INVALID_TEST_PROJECT_1 from "./testData/invalidTest.json" with { type: "json" };
import { db } from "#db/index.js";
import { catalogs, projects } from "#db/schema.js";
import { eq } from "drizzle-orm";
import { LANGUAGES } from "#types/languages.type.js";

let cookies: string[];
let csrfToken: string;

beforeAll(async () => {
    // Get CSRF token
    const csrfRes = await request(app).get("/api/csrf-token"); // Replace with your actual path
    csrfToken = csrfRes.body.token;

    const setCookieHeader = csrfRes.headers["set-cookie"];
    cookies = setCookieHeader !== undefined ? [setCookieHeader] : [];
    cookies = [...cookies, "accessToken=fakeaccessToken"];
    expect(csrfRes.status).toBe(200);
    csrfToken = csrfRes.body.token;
});

describe("import a project", () => {
    it("should import a simple project", async () => {
        const res = await request(app)
            .post("/api/import")
            .send({ ...VALID_TEST_PROJECT_SMALL })
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(204);
    });

    it("should not import a simple project(wrong datamodelType)", async () => {
        const res = await request(app)
            .post("/api/import")
            .send({
                ...INVALID_TEST_PROJECT_1,
            })
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
    });

    it("should import a bigger project", async () => {
        const res = await request(app)
            .post("/api/import")
            .send({ ...VALID_TEST_PROJECT })
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(204);
    });

    it("should import a bigger project with a connection", async () => {
        const res = await request(app)
            .post("/api/import")
            .send({ ...VALID_TEST_PROJECT_1 })
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(204);
    });

    it("should import a simple project existing catalog", async () => {
        await db.insert(catalogs).values({
            name: "Test catalog",
            language: LANGUAGES.EN,
        });

        const res = await request(app)
            .post("/api/import")
            .send({ ...VALID_TEST_PROJECT })
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(204);
    });

    it("should import a project whose component type symbol is a data:image/svg+xml URL", async () => {
        const project = JSON.parse(JSON.stringify(VALID_TEST_PROJECT));
        project.componentTypes[0].symbol = "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=";

        const res = await request(app)
            .post("/api/import")
            .send(project)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(204);
    });

    it("should reject an import whose component type symbol is an unsupported image data URL", async () => {
        const project = JSON.parse(JSON.stringify(VALID_TEST_PROJECT));
        project.componentTypes[0].symbol = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";

        const res = await request(app)
            .post("/api/import")
            .send(project)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
    });

    it("should reject an import whose system component symbol exceeds the size limit", async () => {
        const project = JSON.parse(JSON.stringify(VALID_TEST_PROJECT));
        project.system.data.components[0].symbol = `data:image/png;base64,${"A".repeat(200000)}`;

        const res = await request(app)
            .post("/api/import")
            .send(project)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
    });

    it("should reject an import whose componentTypes is an object instead of an array", async () => {
        const project = JSON.parse(JSON.stringify(VALID_TEST_PROJECT));
        project.componentTypes = {};

        const res = await request(app)
            .post("/api/import")
            .send(project)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
    });

    it("should reject an import whose system components is an object instead of an array", async () => {
        const project = JSON.parse(JSON.stringify(VALID_TEST_PROJECT));
        project.system.data.components = {};

        const res = await request(app)
            .post("/api/import")
            .send(project)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
    });
});

describe("get report from imported project", () => {
    let projectId: number;
    beforeEach(async () => {
        const res = await request(app)
            .post("/api/import")
            .send({ ...VALID_TEST_PROJECT })
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(204);

        const project = await db.query.projects.findFirst({
            where: eq(projects.name, VALID_TEST_PROJECT.project.name),
        });
        projectId = project!.id;
    });

    it("should get a report from an imported project", async () => {
        const res = await request(app)
            .get("/api/projects/" + projectId + "/report")
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
    });

    it("should get a export from an imported project", async () => {
        const res = await request(app)
            .get("/api/export/" + projectId)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
    });
});
