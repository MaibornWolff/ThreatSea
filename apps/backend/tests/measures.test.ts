/**
 * Module that defines tests for measures.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { nanoid } from "nanoid";
import { db } from "#db/index.js";
import { catalogs, measureImpacts, measures, threats, usersCatalogs } from "#db/schema.js";
import { POINTS_OF_ATTACK } from "#types/points-of-attack.types.js";
import { ATTACKERS } from "#types/attackers.types.js";
import { CONFIDENTIALITY_LEVELS } from "#types/confidentiality-levels.types.js";
import { app } from "#server.js";
import { LANGUAGES } from "#types/languages.type.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import { CreateProjectRequest } from "#types/project.types.js";
import { CreateMeasureRequest } from "#types/measure.types.js";
import { CreateMeasureImpactRequest } from "#types/measure-impact.types.js";
import { CreateThreatRequest } from "#types/threat.types.js";
import { CreateCatalogThreatRequest } from "#types/catalog-threat.types.js";
import { CreateCatalogMeasureRequest } from "#types/catalog-measure.types.js";

const VALID_PROJECT: Omit<InstanceType<typeof CreateProjectRequest>, "catalogId"> = {
    name: "Project 1",
    description: "Des 1",
    confidentialityLevel: CONFIDENTIALITY_LEVELS.INTERNAL,
};

const VALID_MEASURE_1: Omit<InstanceType<typeof CreateMeasureRequest>, "catalogMeasureId"> = {
    name: "valid threat from measure",
    description: "valid description test test",
    scheduledAt: "2022-02-01 00:00:00+00",
};

const VALID_MEASURE_2: InstanceType<typeof CreateMeasureRequest> = {
    name: "valid threat 2",
    description: "valid description test 2",
    scheduledAt: "2025-10-10 00:00:00+00",
    catalogMeasureId: null,
};

const VALID_MEASURE_3: InstanceType<typeof CreateMeasureRequest> = {
    name: "valid threat 3",
    description: "valid description test 3",
    scheduledAt: "2025-10-10 00:00:00+00",
    catalogMeasureId: null,
};

const VALID_MEASURE_IMPACT_1: Omit<InstanceType<typeof CreateMeasureImpactRequest>, "measureId" | "threatId"> = {
    probability: 2,
    description: "",
    damage: 2,
    setsOutOfScope: false,
    impactsProbability: true,
    impactsDamage: true,
};

const INVALID_MEASURE_NAME_MISSING: Omit<InstanceType<typeof CreateMeasureRequest>, "name"> = {
    description: "valid description test test",
    scheduledAt: "2022-02-01 00:00:00+00",
    catalogMeasureId: null,
};

const INVALID_MEASURE_SCHEDULED_AT_MISSING: Omit<InstanceType<typeof CreateMeasureRequest>, "scheduledAt"> = {
    name: "valid threat",
    description: "valid description test test",
    catalogMeasureId: null,
};

const VALID_THREAT_1: Omit<InstanceType<typeof CreateThreatRequest>, "catalogThreatId"> = {
    pointOfAttackId: nanoid(),
    name: "valid threat",
    description: "valid description test test",
    pointOfAttack: POINTS_OF_ATTACK.COMMUNICATION_INFRASTRUCTURE,
    attacker: ATTACKERS.ADMINISTRATORS,
    probability: 2,
    confidentiality: true,
    integrity: true,
    availability: false,
    doneEditing: false,
};

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

const VALID_CATALOG_MEASURE_1: InstanceType<typeof CreateCatalogMeasureRequest> = {
    name: "Catalog Measure 1",
    description: "Description 1",
    pointOfAttack: POINTS_OF_ATTACK.USER_INTERFACE,
    attacker: ATTACKERS.SYSTEM_USERS,
    probability: 5,
    confidentiality: false,
    integrity: false,
    availability: true,
};

let projectId: number;
let catalogThreatId: number;
let catalogMeasureId: number;
let threatId: number;

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
                name: "Katalog 1",
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

    const catalogThreatRes = await request(app)
        .post("/catalogs/" + catalogId + "/threats")
        .send(VALID_CATALOG_THREAT_1)
        .set("X-CSRF-TOKEN", csrfToken)
        .set("Cookie", cookies);
    catalogThreatId = catalogThreatRes.body.id;

    const projectRes = await request(app)
        .post("/projects")
        .send({ ...VALID_PROJECT, catalogId })
        .set("X-CSRF-TOKEN", csrfToken)
        .set("Cookie", cookies);
    projectId = projectRes.body.id;

    const catalogMeasuresRes = await request(app)
        .post("/catalogs/" + catalogId + "/measures")
        .send(VALID_CATALOG_MEASURE_1)
        .set("X-CSRF-TOKEN", csrfToken)
        .set("Cookie", cookies);
    catalogMeasureId = catalogMeasuresRes.body.id;

    await request(app)
        .post(`/projects/${projectId}/system/measures`)
        .send({ ...VALID_MEASURE_3, catalogMeasureId: null, threatId })
        .set("X-CSRF-TOKEN", csrfToken)
        .set("Cookie", cookies);

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

describe("get or create measures", () => {
    it("should list all measures", async () => {
        const res = await request(app)
            .get(`/projects/${projectId}/system/measures`)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it("should create a measure", async () => {
        const res = await request(app)
            .post(`/projects/${projectId}/system/measures`)
            .send({ ...VALID_MEASURE_1, catalogMeasureId: catalogMeasureId })
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
        expect(res.body.projectId).toBe(projectId);
        // expect(res.body.threatId).toBe(threatId);
        expect(res.body.catalogMeasureId).toBe(catalogMeasureId);
        expect(res.body.name).toBe(VALID_MEASURE_1.name);
        expect(res.body.description).toBe(VALID_MEASURE_1.description);
        expect(res.body.scheduledAt).toBe(VALID_MEASURE_1.scheduledAt);
    });

    it("should create a measure without catalog measure", async () => {
        const res = await request(app)
            .post(`/projects/${projectId}/system/measures`)
            .send({ ...VALID_MEASURE_1, catalogMeasureId: null, threatId })
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
        expect(res.body.projectId).toBe(projectId);
        expect(res.body.catalogMeasureId).toBe(null);
        expect(res.body.name).toBe(VALID_MEASURE_1.name);
        expect(res.body.description).toBe(VALID_MEASURE_1.description);
        expect(res.body.scheduledAt).toBe(VALID_MEASURE_1.scheduledAt);
    });

    it("should not create a measure (name missing)", async () => {
        const res = await request(app)
            .post(`/projects/${projectId}/system/measures`)
            .send({ ...INVALID_MEASURE_NAME_MISSING, threatId })
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
        expect(res.body.validationErrors).toBeDefined();
    });

    it("should not create a measure (name not unique)", async () => {
        const res = await request(app)
            .post(`/projects/${projectId}/system/measures`)
            .send({ ...VALID_MEASURE_3, threatId })
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(409);
    });

    it("should not create a measure (scheduled at missing)", async () => {
        const res = await request(app)
            .post(`/projects/${projectId}/system/measures`)
            .send({ ...INVALID_MEASURE_SCHEDULED_AT_MISSING, threatId })
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
        expect(res.body.validationErrors).toBeDefined();
    });
});

describe("get, delete or update a single measure", () => {
    let measureId: number;
    beforeEach(async () => {
        const measure = (
            await db
                .insert(measures)
                .values({
                    ...VALID_MEASURE_1,
                    catalogMeasureId,
                    projectId,
                })
                .returning()
        ).at(0);
        measureId = measure!.id;
        await db.insert(measureImpacts).values({ ...VALID_MEASURE_IMPACT_1, threatId, measureId });
    });

    it("should update a measure", async () => {
        const res = await request(app)
            .put("/projects/" + projectId + "/system/measures/" + measureId)
            .send(VALID_MEASURE_2)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
        expect(res.body.name).toBe(VALID_MEASURE_2.name);
        expect(res.body.description).toBe(VALID_MEASURE_2.description);
        expect(res.body.scheduledAt).toBe(VALID_MEASURE_2.scheduledAt);
    });

    it("should delete a measure", async () => {
        const res = await request(app)
            .delete("/projects/" + projectId + "/system/measures/" + measureId)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(204);
    });
});

describe("measures impacts (invalid data)", () => {
    let otherProjectId: number;
    let catalogId: number;
    let measureId: number;
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

        const authRes = await request(app).get("/auth/status").set("X-CSRF-TOKEN", csrfToken).set("Cookie", cookies);
        const userId = authRes.body.data.userId;

        await db.insert(usersCatalogs).values({
            userId,
            catalogId,
            role: USER_ROLES.OWNER,
        });

        const res = await request(app)
            .post("/projects")
            .send({ ...VALID_PROJECT, catalogId })
            .set("Authorization", "Bearer fakeToken")
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        otherProjectId = res.body.id;

        const measure = (
            await db
                .insert(measures)
                .values({
                    ...VALID_MEASURE_1,
                    catalogMeasureId,
                    projectId,
                })
                .returning()
        ).at(0);
        measureId = measure!.id;
        await db.insert(measureImpacts).values({ ...VALID_MEASURE_IMPACT_1, threatId, measureId });
    });

    it("should not update a single measure impact (invalid projectId)", async () => {
        const res = await request(app)
            .put("/projects/" + otherProjectId + "/system/measures/" + measureId)
            .send(VALID_MEASURE_1)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
    });

    it("should not delete a single measure impact(invalid projectId)", async () => {
        const res = await request(app)
            .delete("/projects/" + otherProjectId + "/system/measures/" + measureId)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
    });
});
