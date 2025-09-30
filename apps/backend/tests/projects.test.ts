/**
 * Module that defines tests for the
 * project page.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { db } from "#db/index.js";
import { catalogs, usersCatalogs } from "#db/schema.js";
import { CONFIDENTIALITY_LEVELS } from "#types/confidentiality-levels.types.js";
import { app } from "#server.js";
import { LANGUAGES } from "#types/languages.type.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import { CreateProjectRequest, UpdateProjectRequest } from "#types/project.types.js";

const VALID_PROJECT: Omit<InstanceType<typeof CreateProjectRequest>, "catalogId"> = {
    name: "Project 1",
    description: "Des 1",
    confidentialityLevel: CONFIDENTIALITY_LEVELS.INTERNAL,
};

const VALID_PROJECT_UPDATE: InstanceType<typeof UpdateProjectRequest> = {
    name: "Project 2",
    description: "Des 2",
    confidentialityLevel: CONFIDENTIALITY_LEVELS.CONFIDENTIAL,
    lineOfToleranceGreen: 1,
    lineOfToleranceRed: 20,
};

const INVALID_PROJECT_NAME_MISSING: Omit<InstanceType<typeof CreateProjectRequest>, "catalogId" | "name"> = {
    description: "Des 1",
    confidentialityLevel: CONFIDENTIALITY_LEVELS.INTERNAL,
};

const INVALID_PROJECT_NAME_TOO_LONG: Omit<InstanceType<typeof CreateProjectRequest>, "catalogId"> = {
    name: "NAME TOO LONG Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata",
    description: "Des 1",
    confidentialityLevel: CONFIDENTIALITY_LEVELS.INTERNAL,
};

const INVALID_PROJECT_UPDATE_LOT_RATIO: InstanceType<typeof UpdateProjectRequest> = {
    name: "Project 2",
    description: "Des 2",
    confidentialityLevel: CONFIDENTIALITY_LEVELS.CONFIDENTIAL,
    lineOfToleranceGreen: 13,
    lineOfToleranceRed: 7,
};

let cookies: string[];
let csrfToken: string;

beforeAll(async () => {
    // Get CSRF token
    const csrfRes = await request(app).get("/csrf-token"); // Replace with your actual path
    csrfToken = csrfRes.body.token;

    const setCookieHeader = csrfRes.headers["set-cookie"];
    cookies = setCookieHeader !== undefined ? [setCookieHeader] : [];
    cookies = [...cookies, "accessToken=fakeaccessToken"];
    expect(csrfRes.status).toBe(200);
    csrfToken = csrfRes.body.token;
});

describe("project tests", () => {
    let catalogId: number;
    let projectId: number;
    beforeEach(async () => {
        const catalog = (
            await db
                .insert(catalogs)
                .values({
                    name: "Catalog 1",
                    language: LANGUAGES.EN,
                })
                .returning()
        ).at(0);
        catalogId = catalog!.id;

        const authRes = await request(app).get("/auth/status").set("X-CSRF-TOKEN", csrfToken).set("Cookie", cookies);
        const userId = authRes.body.data.userId;

        await db.insert(usersCatalogs).values({
            userId,
            catalogId,
            role: USER_ROLES.OWNER,
        });
    });

    describe("get or create projects", () => {
        it("should list all projects", async () => {
            const res = await request(app).get("/projects").set("X-CSRF-TOKEN", csrfToken).set("Cookie", cookies);
            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        it("should not get a specific project (invalid projectId)", async () => {
            const res = await request(app)
                .get("/projects/999999")
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(res.statusCode).toEqual(404);
        });

        it("should create a new project", async () => {
            const res = await request(app)
                .post("/projects")
                .send({ ...VALID_PROJECT, catalogId })
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(res.statusCode).toEqual(200);
            projectId = res.body.id;
        });

        it("should not create a new project (name missing)", async () => {
            const res = await request(app)
                .post("/projects")
                .send({ ...INVALID_PROJECT_NAME_MISSING, catalogId })
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(res.statusCode).toEqual(400);
            expect(res.body.validationErrors).toBeDefined();
        });

        it("should not create a new project (name too long)", async () => {
            const res = await request(app)
                .post("/projects")
                .send({
                    ...INVALID_PROJECT_NAME_TOO_LONG,
                    catalogId,
                })
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(res.statusCode).toBe(400);
            expect(res.body.validationErrors).toBeDefined();
        });
    });

    describe("delete or update projects", () => {
        it("should list specific project", async () => {
            const res = await request(app)
                .get("/projects/" + projectId)
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(res.statusCode).toEqual(200);
        });

        it("should generate a report of a specific project", async () => {
            const res = await request(app)
                .get("/projects/" + projectId + "/report")
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(res.statusCode).toEqual(200);
        });

        it("should update a project", async () => {
            const res = await request(app)
                .put("/projects/" + projectId)
                .send(VALID_PROJECT_UPDATE)
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(res.statusCode).toEqual(200);
            expect(res.body.name).toBe(VALID_PROJECT_UPDATE.name);
            expect(res.body.description).toBe(VALID_PROJECT_UPDATE.description);
            expect(res.body.confidentialityLevel).toBe(VALID_PROJECT_UPDATE.confidentialityLevel);
            expect(res.body.lineOfToleranceGreen).toBe(VALID_PROJECT_UPDATE.lineOfToleranceGreen);
            expect(res.body.lineOfToleranceRed).toBe(VALID_PROJECT_UPDATE.lineOfToleranceRed);
        });

        it("should not update a project (invalid lines of tolerance ratio)", async () => {
            const res = await request(app)
                .put("/projects/" + projectId)
                .send(INVALID_PROJECT_UPDATE_LOT_RATIO)
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(res.statusCode).toBe(400);
            expect(res.body.validationErrors).toBeDefined();
        });

        it("should delete a project", async () => {
            const res = await request(app)
                .delete("/projects/" + projectId)
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(res.statusCode).toEqual(204);
        });
    });
});
