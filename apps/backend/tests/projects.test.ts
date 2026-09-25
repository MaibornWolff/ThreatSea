/**
 * Module that defines tests for the
 * project page.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { and, eq } from "drizzle-orm";
import { db } from "#db/index.js";
import { catalogs, usersCatalogs, usersProjects } from "#db/schema.js";
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

const VALID_LINE_OF_TOLERANCE_UPDATE = {
    lineOfToleranceGreen: 3,
    lineOfToleranceRed: 16,
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
    const csrfRes = await request(app).get("/api/csrf-token"); // Replace with your actual path
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
    let userId: number;
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

        const authRes = await request(app)
            .get("/api/auth/status")
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        userId = authRes.body.data.userId;

        await db.insert(usersCatalogs).values({
            userId,
            catalogId,
            role: USER_ROLES.OWNER,
        });
    });

    describe("get or create projects", () => {
        it("should list all projects", async () => {
            const res = await request(app).get("/api/projects").set("X-CSRF-TOKEN", csrfToken).set("Cookie", cookies);
            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        it("should not get a specific project (invalid projectId)", async () => {
            const res = await request(app)
                .get("/api/projects/999999")
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(res.statusCode).toEqual(404);
        });

        it("should create a new project", async () => {
            const res = await request(app)
                .post("/api/projects")
                .send({ ...VALID_PROJECT, catalogId })
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(res.statusCode).toEqual(200);
            projectId = res.body.id;
        });

        it("should not create a new project (name missing)", async () => {
            const res = await request(app)
                .post("/api/projects")
                .send({ ...INVALID_PROJECT_NAME_MISSING, catalogId })
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(res.statusCode).toEqual(400);
            expect(res.body.validationErrors).toBeDefined();
        });

        it("should not create a new project (name too long)", async () => {
            const res = await request(app)
                .post("/api/projects")
                .send({
                    ...INVALID_PROJECT_NAME_TOO_LONG,
                    catalogId,
                })
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(res.statusCode).toBe(400);
            expect(res.body.validationErrors).toBeDefined();
        });

        it("should not create a new project on a catalog the user cannot access", async () => {
            const otherUsersCatalog = (
                await db.insert(catalogs).values({ name: "Other user's catalog", language: LANGUAGES.EN }).returning()
            ).at(0)!;

            const res = await request(app)
                .post("/api/projects")
                .send({ ...VALID_PROJECT, catalogId: otherUsersCatalog.id })
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(res.statusCode).toEqual(404);

            const projectsResponse = await request(app)
                .get("/api/projects")
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            const projectCatalogIds = projectsResponse.body.map((project: { catalogId: number }) => project.catalogId);
            expect(projectCatalogIds).not.toContain(otherUsersCatalog.id);
        });

        it("should not create a new project on a catalog that does not exist", async () => {
            const res = await request(app)
                .post("/api/projects")
                .send({ ...VALID_PROJECT, catalogId: 999999 })
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(res.statusCode).toEqual(404);
        });
    });

    describe("delete or update projects", () => {
        it("should list specific project", async () => {
            const res = await request(app)
                .get("/api/projects/" + projectId)
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(res.statusCode).toEqual(200);
        });

        it("should generate a report of a specific project", async () => {
            const res = await request(app)
                .get("/api/projects/" + projectId + "/report")
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(res.statusCode).toEqual(200);
        });

        it("should update a project", async () => {
            const res = await request(app)
                .put("/api/projects/" + projectId)
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
                .put("/api/projects/" + projectId)
                .send(INVALID_PROJECT_UPDATE_LOT_RATIO)
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(res.statusCode).toBe(400);
            expect(res.body.validationErrors).toBeDefined();
        });

        it("should change the catalog of a project to a catalog the user can access", async () => {
            const projectResponse = await request(app)
                .get("/api/projects/" + projectId)
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(projectResponse.statusCode).toEqual(200);
            // beforeEach created a fresh catalog, so catalogId names a different one.
            expect(catalogId).not.toBe(projectResponse.body.catalogId);

            const response = await request(app)
                .put("/api/projects/" + projectId)
                .send({ ...VALID_PROJECT_UPDATE, catalogId })
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(response.statusCode).toEqual(200);
            expect(response.body.catalogId).toBe(catalogId);
        });

        it("should not change the catalog of a project to a catalog the user cannot access", async () => {
            const projectResponse = await request(app)
                .get("/api/projects/" + projectId)
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            const originalCatalogId = projectResponse.body.catalogId;
            const otherUsersCatalog = (
                await db.insert(catalogs).values({ name: "Other user's catalog", language: LANGUAGES.EN }).returning()
            ).at(0)!;

            const response = await request(app)
                .put("/api/projects/" + projectId)
                .send({ ...VALID_PROJECT_UPDATE, catalogId: otherUsersCatalog.id })
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(response.statusCode).toEqual(404);

            const unchangedProjectResponse = await request(app)
                .get("/api/projects/" + projectId)
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(unchangedProjectResponse.body.catalogId).toBe(originalCatalogId);
        });

        it("should update a project whose current catalog the user can no longer access", async () => {
            const projectResponse = await request(app)
                .get("/api/projects/" + projectId)
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            const currentCatalogId = projectResponse.body.catalogId;
            await db
                .delete(usersCatalogs)
                .where(and(eq(usersCatalogs.catalogId, currentCatalogId), eq(usersCatalogs.userId, userId)));

            const response = await request(app)
                .put("/api/projects/" + projectId)
                .send({ ...VALID_PROJECT_UPDATE, name: "Project 3", catalogId: currentCatalogId })
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(response.statusCode).toEqual(200);
            expect(response.body.name).toBe("Project 3");
            expect(response.body.catalogId).toBe(currentCatalogId);
        });

        it("should delete a project", async () => {
            const res = await request(app)
                .delete("/api/projects/" + projectId)
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(res.statusCode).toEqual(204);
        });
    });

    describe("update lines of tolerance", () => {
        let lineOfToleranceProjectId: number;

        const setOwnRole = async (role: USER_ROLES) => {
            await db
                .update(usersProjects)
                .set({ role })
                .where(and(eq(usersProjects.userId, userId), eq(usersProjects.projectId, lineOfToleranceProjectId)));
        };

        const putLineOfTolerance = (body: object) =>
            request(app)
                .put("/api/projects/" + lineOfToleranceProjectId + "/lineOfTolerance")
                .send(body)
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);

        beforeEach(async () => {
            const res = await request(app)
                .post("/api/projects")
                .send({ ...VALID_PROJECT, catalogId })
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            lineOfToleranceProjectId = res.body.id;
        });

        it("should let an owner update the lines of tolerance", async () => {
            const res = await putLineOfTolerance(VALID_LINE_OF_TOLERANCE_UPDATE);

            expect(res.statusCode).toBe(200);
            expect(res.body.lineOfToleranceGreen).toBe(VALID_LINE_OF_TOLERANCE_UPDATE.lineOfToleranceGreen);
            expect(res.body.lineOfToleranceRed).toBe(VALID_LINE_OF_TOLERANCE_UPDATE.lineOfToleranceRed);
        });

        it("should let an editor update the lines of tolerance and persist them", async () => {
            await setOwnRole(USER_ROLES.EDITOR);

            const res = await putLineOfTolerance(VALID_LINE_OF_TOLERANCE_UPDATE);
            expect(res.statusCode).toBe(200);

            const getRes = await request(app)
                .get("/api/projects/" + lineOfToleranceProjectId)
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(getRes.body.lineOfToleranceGreen).toBe(VALID_LINE_OF_TOLERANCE_UPDATE.lineOfToleranceGreen);
            expect(getRes.body.lineOfToleranceRed).toBe(VALID_LINE_OF_TOLERANCE_UPDATE.lineOfToleranceRed);
            expect(getRes.body.name).toBe(VALID_PROJECT.name);
        });

        it("should not let an editor update the project details", async () => {
            await setOwnRole(USER_ROLES.EDITOR);

            const res = await request(app)
                .put("/api/projects/" + lineOfToleranceProjectId)
                .send(VALID_PROJECT_UPDATE)
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);

            expect(res.statusCode).toBe(403);
        });

        it("should not let a viewer update the lines of tolerance", async () => {
            await setOwnRole(USER_ROLES.VIEWER);

            const res = await putLineOfTolerance(VALID_LINE_OF_TOLERANCE_UPDATE);

            expect(res.statusCode).toBe(403);
        });

        it("should not update the lines of tolerance (green above red)", async () => {
            const res = await putLineOfTolerance({ lineOfToleranceGreen: 15, lineOfToleranceRed: 6 });

            expect(res.statusCode).toBe(400);
            expect(res.body.validationErrors).toBeDefined();
        });

        it("should not update the lines of tolerance (value missing)", async () => {
            const res = await putLineOfTolerance({ lineOfToleranceGreen: 3 });

            expect(res.statusCode).toBe(400);
            expect(res.body.validationErrors).toBeDefined();
        });
    });
});
