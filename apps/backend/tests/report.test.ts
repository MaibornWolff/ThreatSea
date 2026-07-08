/**
 * Module that defines tests for the report.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { db } from "#db/index.js";
import { catalogs, usersCatalogs } from "#db/schema.js";
import { CONFIDENTIALITY_LEVELS } from "#types/confidentiality-levels.types.js";
import { app } from "#server.js";
import { LANGUAGES } from "#types/languages.type.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import { CreateProjectRequest } from "#types/project.types.js";

const VALID_PROJECT: Omit<InstanceType<typeof CreateProjectRequest>, "catalogId"> = {
    name: "Project 1",
    description: "Des 1",
    confidentialityLevel: CONFIDENTIALITY_LEVELS.INTERNAL,
};

function makeSystemBody(componentNames: string[], description?: string) {
    return {
        data: {
            connections: [],
            pointsOfAttack: [],
            connectionPoints: [],
            annotations: [],
            lastAutoSaveDate: "2025-01-01T00:00:00.000Z",
            components: componentNames.map((name, index) => ({
                id: "comp-" + index,
                name,
                description,
                type: 0,
                x: 0,
                y: 0,
                gridX: 0,
                gridY: 0,
                width: 80,
                height: 80,
                selected: false,
                projectId: 0,
                symbol: "",
            })),
        },
        image: "",
    };
}

let projectId: number;
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

beforeEach(async () => {
    const catalog = (
        await db
            .insert(catalogs)
            .values({
                name: "Katalog 1",
                language: LANGUAGES.EN,
            })
            .returning()
    ).at(0);
    const catalogId = catalog!.id;

    const authRes = await request(app).get("/api/auth/status").set("X-CSRF-TOKEN", csrfToken).set("Cookie", cookies);
    const userId = authRes.body.data.userId;

    await db.insert(usersCatalogs).values({
        userId,
        catalogId,
        role: USER_ROLES.OWNER,
    });

    const res = await request(app)
        .post("/api/projects")
        .send({ ...VALID_PROJECT, catalogId })
        .set("X-CSRF-TOKEN", csrfToken)
        .set("Cookie", cookies);
    projectId = res.body.id;
});

describe("report", () => {
    it("should generate a report", async () => {
        const res = await request(app)
            .get("/api/projects/" + projectId + "/report")
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
    });

    it("should include a components array in the report", async () => {
        const res = await request(app)
            .get("/api/projects/" + projectId + "/report")
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body.components)).toBe(true);
    });

    it("sorts components by name and tags them with sequential report ids", async () => {
        // Save a system whose components are intentionally out of alphabetical order.
        await request(app)
            .put("/api/projects/" + projectId + "/system")
            .send(makeSystemBody(["Zebra Service", "Alpha Service"]))
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);

        const res = await request(app)
            .get("/api/projects/" + projectId + "/report")
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);

        expect(res.statusCode).toEqual(200);
        expect(res.body.components.map((component: { name: string }) => component.name)).toEqual([
            "Alpha Service",
            "Zebra Service",
        ]);
        expect(res.body.components.map((component: { reportId: string }) => component.reportId)).toEqual([
            "C.1",
            "C.2",
        ]);
    });

    it("carries the component description through into the report", async () => {
        await request(app)
            .put("/api/projects/" + projectId + "/system")
            .send(makeSystemBody(["Only Component"], "A described component."))
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);

        const res = await request(app)
            .get("/api/projects/" + projectId + "/report")
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);

        expect(res.statusCode).toEqual(200);
        expect(res.body.components).toHaveLength(1);
        expect(res.body.components[0].description).toEqual("A described component.");
    });
});
