/**
 * Module that defines test for the threats.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { nanoid } from "nanoid";
import { db } from "#db/index.js";
import { catalogs, threats, usersCatalogs } from "#db/schema.js";
import { POINTS_OF_ATTACK } from "#types/points-of-attack.types.js";
import { ATTACKERS } from "#types/attackers.types.js";
import { CONFIDENTIALITY_LEVELS } from "#types/confidentiality-levels.types.js";
import { app } from "#server.js";
import { LANGUAGES } from "#types/languages.type.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import { CreateCatalogThreatRequest } from "#types/catalog-threat.types.js";
import { CreateThreatRequest, UpdateThreatRequest } from "#types/threat.types.js";

const VALID_CATALOG_THREAT_1: InstanceType<typeof CreateCatalogThreatRequest> = {
    name: "Catalog Threat 1",
    description: "Description 1",
    pointOfAttack: POINTS_OF_ATTACK.COMMUNICATION_INTERFACES,
    attacker: ATTACKERS.ADMINISTRATORS,
    probability: 1,
    confidentiality: true,
    integrity: false,
    availability: true,
};

const VALID_THREAT_1: Omit<InstanceType<typeof CreateThreatRequest>, "catalogThreatId"> = {
    pointOfAttackId: nanoid(),
    name: "valid threat 1",
    description: "valid description test 1",
    pointOfAttack: POINTS_OF_ATTACK.COMMUNICATION_INFRASTRUCTURE,
    attacker: ATTACKERS.ADMINISTRATORS,
    probability: 2,
    confidentiality: true,
    integrity: true,
    availability: false,
    doneEditing: false,
};

const VALID_UPDATE_THREAT: InstanceType<typeof UpdateThreatRequest> = {
    name: "valid threat 2",
    description: "valid description test 2",
    probability: 3,
    confidentiality: false,
    integrity: false,
    availability: true,
    doneEditing: true,
};

const INVALID_THREAT_NAME_MISSING: Omit<InstanceType<typeof CreateThreatRequest>, "catalogThreatId" | "name"> = {
    pointOfAttackId: nanoid(),
    description: "valid description test test",
    pointOfAttack: POINTS_OF_ATTACK.DATA_STORAGE_INFRASTRUCTURE,
    attacker: ATTACKERS.SYSTEM_USERS,
    probability: 3,
    confidentiality: false,
    integrity: true,
    availability: false,
    doneEditing: false,
};

const INVALID_THREAT_POA_MISSING: Omit<
    InstanceType<typeof CreateThreatRequest>,
    "catalogThreatId" | "pointOfAttack" | "pointOfAttackId"
> = {
    name: "valid threat",
    description: "valid description test test",
    attacker: ATTACKERS.SYSTEM_USERS,
    probability: 3,
    confidentiality: false,
    integrity: true,
    availability: false,
    doneEditing: false,
};

const INVALID_THREAT_PROB_TOO_HIGH: Omit<InstanceType<typeof CreateThreatRequest>, "catalogThreatId"> = {
    pointOfAttackId: nanoid(),
    name: "valid threat",
    description: "valid description test test",
    pointOfAttack: POINTS_OF_ATTACK.COMMUNICATION_INFRASTRUCTURE,
    attacker: ATTACKERS.ADMINISTRATORS,
    probability: 6,
    confidentiality: true,
    integrity: true,
    availability: false,
    doneEditing: false,
};

const INVALID_THREAT_PROB_TOO_LOW: Omit<InstanceType<typeof CreateThreatRequest>, "catalogThreatId"> = {
    pointOfAttackId: nanoid(),
    name: "valid threat",
    description: "valid description test test",
    pointOfAttack: POINTS_OF_ATTACK.COMMUNICATION_INFRASTRUCTURE,
    attacker: ATTACKERS.ADMINISTRATORS,
    probability: 0,
    confidentiality: true,
    integrity: true,
    availability: false,
    doneEditing: false,
};

let projectId: number;
let catalogThreatId: number;
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

beforeEach(async () => {
    const catalog = (
        await db
            .insert(catalogs)
            .values({
                name: "Catalog 1",
                language: LANGUAGES.EN,
            })
            .returning()
    ).at(0)!;
    const catalogId = catalog.id;

    const authRes = await request(app).get("/auth/status").set("X-CSRF-TOKEN", csrfToken).set("Cookie", cookies);
    const userId = authRes.body.data.userId;

    await db.insert(usersCatalogs).values({
        userId,
        catalogId,
        role: USER_ROLES.OWNER,
    });

    const threatRes = await request(app)
        .post("/catalogs/" + catalogId + "/threats")
        .send(VALID_CATALOG_THREAT_1)
        .set("X-CSRF-TOKEN", csrfToken)
        .set("Cookie", cookies);
    catalogThreatId = threatRes.body.id;

    const VALID_PROJECT = {
        name: "Project 1",
        description: "Description 1",
        confidentialityLevel: CONFIDENTIALITY_LEVELS.INTERNAL,
    };

    const projectRes = await request(app)
        .post("/projects")
        .send({ ...VALID_PROJECT, catalogId })
        .set("X-CSRF-TOKEN", csrfToken)
        .set("Cookie", cookies);
    projectId = projectRes.body.id;
});

describe("get or create threats", () => {
    it("should list all threats", async () => {
        const res = await request(app)
            .get(`/projects/${projectId}/system/threats`)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it("should create a threat", async () => {
        const res = await request(app)
            .post(`/projects/${projectId}/system/threats`)
            .send({ ...VALID_THREAT_1, catalogThreatId })
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
        expect(res.body.name).toBe(VALID_THREAT_1.name);
        expect(res.body.description).toBe(VALID_THREAT_1.description);
        expect(res.body.pointOfAttack).toBe(VALID_THREAT_1.pointOfAttack);
        expect(res.body.confidentiality).toBe(VALID_THREAT_1.confidentiality);
    });

    it("should not create a threat (name missing)", async () => {
        const res = await request(app)
            .post(`/projects/${projectId}/system/threats`)
            .send({ ...INVALID_THREAT_NAME_MISSING, catalogThreatId })
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
        expect(res.body.validationErrors).toBeDefined();
    });

    it("should not create a threat (point of attack missing)", async () => {
        const res = await request(app)
            .post(`/projects/${projectId}/system/threats`)
            .send(INVALID_THREAT_POA_MISSING)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
        expect(res.body.validationErrors).toBeDefined();
    });

    it("should not create a threat (probability too high)", async () => {
        const res = await request(app)
            .post(`/projects/${projectId}/system/threats`)
            .send(INVALID_THREAT_PROB_TOO_HIGH)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
        expect(res.body.validationErrors).toBeDefined();
    });

    it("should not create a threat (probability too low)", async () => {
        const res = await request(app)
            .post(`/projects/${projectId}/system/threats`)
            .send(INVALID_THREAT_PROB_TOO_LOW)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
        expect(res.body.validationErrors).toBeDefined();
    });
});

describe("get, delete or update a single threat", () => {
    let threatId: number;
    beforeEach(async () => {
        const threat = (
            await db
                .insert(threats)
                .values({
                    ...VALID_THREAT_1,
                    catalogThreatId,
                    projectId,
                })
                .returning()
        ).at(0);
        threatId = threat!.id;
    });

    it("should get a single threat", async () => {
        const res = await request(app)
            .get(`/projects/${projectId}/system/threats/${threatId}`)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
        expect(res.body.name).toBe(VALID_THREAT_1.name);
    });

    it("should update a threat", async () => {
        const res = await request(app)
            .put("/projects/" + projectId + "/system/threats/" + threatId)
            .send(VALID_UPDATE_THREAT)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
        expect(res.body.name).toBe(VALID_UPDATE_THREAT.name);
        expect(res.body.description).toBe(VALID_UPDATE_THREAT.description);
        expect(res.body.name).toBe(VALID_UPDATE_THREAT.name);
        expect(res.body.attacker).toBe(VALID_THREAT_1.attacker);
        expect(res.body.pointOfAttack).toBe(VALID_THREAT_1.pointOfAttack);
        expect(res.body.probability).toBe(VALID_UPDATE_THREAT.probability);
    });

    it("should delete a threat", async () => {
        const res = await request(app)
            .delete("/projects/" + projectId + "/system/threats/" + threatId)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(204);
    });
});
