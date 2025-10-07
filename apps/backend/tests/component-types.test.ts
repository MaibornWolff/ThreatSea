/**
 * Module that defines tests for the component-types
 * in the database.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { db } from "#db/index.js";
import { catalogs, componentTypes, usersCatalogs } from "#db/schema.js";
import { POINTS_OF_ATTACK } from "#types/points-of-attack.types.js";
import { CONFIDENTIALITY_LEVELS } from "#types/confidentiality-levels.types.js";
import { app } from "#server.js";
import { LANGUAGES } from "#types/languages.type.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import { CreateProjectRequest } from "#types/project.types.js";
import { CreateComponentTypeRequest } from "#types/component-type.types.js";

const VALID_PROJECT: Omit<InstanceType<typeof CreateProjectRequest>, "catalogId"> = {
    name: "Project 1",
    description: "Des 1",
    confidentialityLevel: CONFIDENTIALITY_LEVELS.INTERNAL,
};

const VALID_COMPONENT_TYPE: InstanceType<typeof CreateComponentTypeRequest> = {
    name: "Client2",
    pointsOfAttack: [POINTS_OF_ATTACK.USER_INTERFACE],
    symbol: "data:image/png;base64,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",
};

const VALID_COMPONENT_TYPE_2: InstanceType<typeof CreateComponentTypeRequest> = {
    name: "Client2",
    pointsOfAttack: [POINTS_OF_ATTACK.COMMUNICATION_INFRASTRUCTURE],
    symbol: "data:image/png;base64,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",
};

const VALID_COMPONENT_TYPE_3: InstanceType<typeof CreateComponentTypeRequest> = {
    name: "Client3",
    pointsOfAttack: [POINTS_OF_ATTACK.COMMUNICATION_INFRASTRUCTURE],
    symbol: "data:image/png;base64,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",
};

const VALID_COMPONENT_TYPE_NO_SYMBOL: InstanceType<typeof CreateComponentTypeRequest> = {
    name: "Client2",
    pointsOfAttack: [POINTS_OF_ATTACK.USER_INTERFACE],
    symbol: null,
};

let projectId: number;
let catalogId: number;
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
    catalogId = catalog!.id;

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
        .set("Authorization", "Bearer fakeToken")
        .set("X-CSRF-TOKEN", csrfToken)
        .set("Cookie", cookies);
    projectId = res.body.id;

    await request(app)
        .post("/api/projects/" + projectId + "/componentTypes")
        .send(VALID_COMPONENT_TYPE_3)
        .set("Authorization", "Bearer fakeToken")
        .set("X-CSRF-TOKEN", csrfToken)
        .set("Cookie", cookies);
});

describe("get or create component-types", () => {
    it("should list all component-types", async () => {
        const res = await request(app)
            .get("/api/projects/" + projectId + "/componentTypes")
            .set("Authorization", "Bearer fakeToken")
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it("should create a component-types", async () => {
        const res = await request(app)
            .post("/api/projects/" + projectId + "/componentTypes")
            .send(VALID_COMPONENT_TYPE)
            .set("Authorization", "Bearer fakeToken")
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
    });

    it("should still create a component-types(no symbol)", async () => {
        const res = await request(app)
            .post("/api/projects/" + projectId + "/componentTypes")
            .send(VALID_COMPONENT_TYPE_NO_SYMBOL)
            .set("Authorization", "Bearer fakeToken")
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
    });

    it("should not create a component-types (name not unique)", async () => {
        const res = await request(app)
            .post("/api/projects/" + projectId + "/componentTypes")
            .send(VALID_COMPONENT_TYPE_3)
            .set("Authorization", "Bearer fakeToken")
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(409);
    });
});

describe("updates or deletes component-Type", () => {
    let componentTypeId: number;
    beforeEach(async () => {
        const componentType = (
            await db
                .insert(componentTypes)
                .values({
                    ...VALID_COMPONENT_TYPE,
                    projectId,
                })
                .returning()
        ).at(0);
        componentTypeId = componentType!.id;
    });

    it("should update the component-type", async () => {
        const res = await request(app)
            .put("/api/projects/" + projectId + "/componentTypes/" + componentTypeId)
            .send(VALID_COMPONENT_TYPE_2)
            .set("Authorization", "Bearer fakeToken")
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);

        expect(res.statusCode).toEqual(200);
        expect(res.body.name).toBe(VALID_COMPONENT_TYPE_2.name);
        expect(res.body.pointsOfAttack).toStrictEqual(VALID_COMPONENT_TYPE_2.pointsOfAttack);
        expect(res.body.symbol).toBe(VALID_COMPONENT_TYPE_2.symbol);
    });

    it("should delete the component-type", async () => {
        const res = await request(app)
            .delete("/api/projects/" + projectId + "/componentTypes/" + componentTypeId)
            .set("Authorization", "Bearer fakeToken")
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);

        expect(res.statusCode).toEqual(204);
    });
});
