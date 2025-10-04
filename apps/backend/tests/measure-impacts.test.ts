/**
 * Module that defines tests for the measure-impacts.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { nanoid } from "nanoid";
import { db } from "#db/index.js";
import {
    catalogMeasures,
    catalogs,
    catalogThreats,
    CreateMeasure,
    measureImpacts,
    measures,
    threats,
    usersCatalogs,
} from "#db/schema.js";
import { POINTS_OF_ATTACK } from "#types/points-of-attack.types.js";
import { ATTACKERS } from "#types/attackers.types.js";
import { CONFIDENTIALITY_LEVELS } from "#types/confidentiality-levels.types.js";
import { app } from "#server.js";
import { LANGUAGES } from "#types/languages.type.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import { CreateProjectRequest } from "#types/project.types.js";
import { CreateThreatRequest } from "#types/threat.types.js";
import { CreateMeasureRequest } from "#types/measure.types.js";
import { CreateCatalogThreatRequest } from "#types/catalog-threat.types.js";
import { CreateCatalogMeasureRequest } from "#types/catalog-measure.types.js";
import { CreateMeasureImpactRequest } from "#types/measure-impact.types.js";
import { and, eq } from "drizzle-orm";

let projectId: number;
let catalogId: number;
let catalogThreatId: number;
let catalogMeasureId: number;
let measureId: number;
let threatId: number;
let cookies: string[];
let csrfToken: string;

const VALID_PROJECT: Omit<InstanceType<typeof CreateProjectRequest>, "catalogId"> = {
    name: "Project 1",
    description: "Des 1",
    confidentialityLevel: CONFIDENTIALITY_LEVELS.INTERNAL,
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

const VALID_MEASURE_1: InstanceType<typeof CreateMeasureRequest> = {
    name: "valid threat",
    description: "valid description test test",
    scheduledAt: "2022-01-01",
    catalogMeasureId: null,
};

const VALID_CATALOG_THREAT_1: InstanceType<typeof CreateCatalogThreatRequest> = {
    name: "Catalog Threat 1",
    description: "Description 1",
    pointOfAttack: POINTS_OF_ATTACK.COMMUNICATION_INFRASTRUCTURE,
    attacker: ATTACKERS.ADMINISTRATORS,
    probability: 1,
    confidentiality: true,
    integrity: false,
    availability: true,
};

const VALID_CATALOG_MEASURE_1: InstanceType<typeof CreateCatalogMeasureRequest> = {
    name: "Catalog Measure from measure-impact 1",
    description: "Description 1",
    pointOfAttack: POINTS_OF_ATTACK.USER_INTERFACE,
    attacker: ATTACKERS.SYSTEM_USERS,
    probability: 5,
    confidentiality: false,
    integrity: false,
    availability: true,
};

const VALID_MEASURE_IMPACT_1: Omit<InstanceType<typeof CreateMeasureImpactRequest>, "measureId" | "threatId"> = {
    description: "Description 1",
    setsOutOfScope: false,
    impactsProbability: true,
    impactsDamage: true,
    probability: 1,
    damage: 1,
};

const VALID_MEASURE_IMPACT_2: Omit<InstanceType<typeof CreateMeasureImpactRequest>, "measureId" | "threatId"> = {
    description: "Description 2",
    setsOutOfScope: true,
    impactsProbability: false,
    impactsDamage: false,
    probability: null,
    damage: null,
};

const INVALID_MEASURE_IMPACT_PROBABILITY_NULL: Omit<
    InstanceType<typeof CreateMeasureImpactRequest>,
    "measureId" | "threatId"
> = {
    description: "Description 1",
    setsOutOfScope: false,
    impactsProbability: true,
    impactsDamage: true,
    probability: null,
    damage: 1,
};

const INVALID_MEASURE_IMPACT_DAMAGE_NULL: Omit<
    InstanceType<typeof CreateMeasureImpactRequest>,
    "measureId" | "threatId"
> = {
    description: "Description 1",
    setsOutOfScope: false,
    impactsProbability: true,
    impactsDamage: true,
    probability: 1,
    damage: null,
};

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

    const catalogThreat = (
        await db
            .insert(catalogThreats)
            .values({
                ...VALID_CATALOG_THREAT_1,
                catalogId,
            })
            .returning()
    ).at(0);
    catalogThreatId = catalogThreat!.id;

    const catalogMeasure = (
        await db
            .insert(catalogMeasures)
            .values({
                ...VALID_CATALOG_MEASURE_1,
                catalogId,
            })
            .returning()
    ).at(0);
    catalogMeasureId = catalogMeasure!.id;

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

    // Deep-cloning VALID_MEASURE_1 to avoid mutation issues
    const clonedValidMeasure: CreateMeasure = JSON.parse(JSON.stringify(VALID_MEASURE_1));
    const measure = (
        await db
            .insert(measures)
            .values({
                ...clonedValidMeasure,
                catalogMeasureId,
                projectId,
            })
            .returning()
    ).at(0);
    measureId = measure!.id;
});

describe("get or create measure impacts", () => {
    it("should list all measure impacts", async () => {
        const res = await request(app)
            .get(`/api/projects/${projectId}/system/measureImpacts`)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
    });

    it("should create a measure impacts", async () => {
        const res = await request(app)
            .post(`/api/projects/${projectId}/system/measureImpacts`)
            .send({
                ...VALID_MEASURE_IMPACT_1,
                threatId,
                measureId,
            })
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
        expect(res.body.measureId).toBe(measureId);
        expect(res.body.threatId).toBe(threatId);
        expect(res.body.description).toBe(VALID_MEASURE_IMPACT_1.description);
        expect(res.body.setsOutOfScope).toBe(VALID_MEASURE_IMPACT_1.setsOutOfScope);
        expect(res.body.impactsProbability).toBe(VALID_MEASURE_IMPACT_1.impactsProbability);
        expect(res.body.probability).toBe(VALID_MEASURE_IMPACT_1.probability);
        expect(res.body.impactsDamage).toBe(VALID_MEASURE_IMPACT_1.impactsDamage);
        expect(res.body.damage).toBe(VALID_MEASURE_IMPACT_1.damage);
    });

    it("should not create a measure impacts (probability null)", async () => {
        const res = await request(app)
            .post(`/api/projects/${projectId}/system/measureImpacts`)
            .send({
                ...INVALID_MEASURE_IMPACT_PROBABILITY_NULL,
                threatId,
                measureId,
            })
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
        expect(res.body.validationErrors).toBeDefined();
    });

    it("should not create a measure impacts (damage null)", async () => {
        const res = await request(app)
            .post(`/api/projects/${projectId}/system/measureImpacts`)
            .send({
                ...INVALID_MEASURE_IMPACT_DAMAGE_NULL,
                threatId,
                measureId,
            })
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
        expect(res.body.validationErrors).toBeDefined();
    });
});

describe("get, delete or update a single measure Impact", () => {
    let measureImpactId: number;

    beforeEach(async () => {
        const measureImpact = (
            await db
                .insert(measureImpacts)
                .values({
                    ...VALID_MEASURE_IMPACT_1,
                    threatId,
                    measureId,
                })
                .returning()
        ).at(0);
        measureImpactId = measureImpact!.id;
    });

    it("should get a single measure impact", async () => {
        const res = await request(app)
            .get(`/api/projects/${projectId}/system/measureImpacts/${measureImpactId}`)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
        expect(res.body.measureId).toBe(measureId);
        expect(res.body.threatId).toBe(threatId);
        expect(res.body.description).toBe(VALID_MEASURE_IMPACT_1.description);
        expect(res.body.setsOutOfScope).toBe(VALID_MEASURE_IMPACT_1.setsOutOfScope);
        expect(res.body.impactsProbability).toBe(VALID_MEASURE_IMPACT_1.impactsProbability);
        expect(res.body.probability).toBe(VALID_MEASURE_IMPACT_1.probability);
        expect(res.body.impactsDamage).toBe(VALID_MEASURE_IMPACT_1.impactsDamage);
        expect(res.body.damage).toBe(VALID_MEASURE_IMPACT_1.damage);
    });

    it("should not get a single measure impact (non exist)", async () => {
        const nonExistentMeasureImpactId = 999999;
        const res = await request(app)
            .get(`/api/projects/${projectId}/system/measureImpacts/${nonExistentMeasureImpactId}`)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(404);
    });

    it("should update a measure", async () => {
        const res = await request(app)
            .put(`/api/projects/${projectId}/system/measureImpacts/${measureImpactId}`)
            .send({
                ...VALID_MEASURE_IMPACT_2,
                threatId,
                measureId,
            })
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
        expect(res.body.measureId).toBe(measureId);
        expect(res.body.threatId).toBe(threatId);
        expect(res.body.description).toBe(VALID_MEASURE_IMPACT_2.description);
        expect(res.body.setsOutOfScope).toBe(VALID_MEASURE_IMPACT_2.setsOutOfScope);
        expect(res.body.impactsProbability).toBe(VALID_MEASURE_IMPACT_2.impactsProbability);
        expect(res.body.probability).toBe(VALID_MEASURE_IMPACT_2.probability);
        expect(res.body.impactsDamage).toBe(VALID_MEASURE_IMPACT_2.impactsDamage);
        expect(res.body.damage).toBe(VALID_MEASURE_IMPACT_2.damage);
    });

    it("should delete a measure", async () => {
        const res = await request(app)
            .delete("/api/projects/" + projectId + "/system/measureImpacts/" + measureImpactId)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(204);
    });

    it("should not delete a measure (non exist)", async () => {
        await db
            .delete(measureImpacts)
            .where(and(eq(measureImpacts.threatId, threatId), eq(measureImpacts.measureId, measureId)));

        const res = await request(app)
            .delete("/api/projects/" + projectId + "/system/measureImpacts/" + measureImpactId)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(404);
    });
});

describe("measures impacts (invalid data)", () => {
    let otherProjectId: number;
    let measureImpactId: number;
    beforeEach(async () => {
        const res = await request(app)
            .post("/api/projects")
            .send({ ...VALID_PROJECT, catalogId })
            .set("Authorization", "Bearer fakeToken")
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        otherProjectId = res.body.id;

        const measureImpact = (
            await db
                .insert(measureImpacts)
                .values({
                    ...VALID_MEASURE_IMPACT_1,
                    threatId,
                    measureId,
                })
                .returning()
        ).at(0);
        measureImpactId = measureImpact!.id;
    });

    it("should not get a single measure impact (invalid projectId)", async () => {
        const res = await request(app)
            .get(`/api/projects/${otherProjectId}/system/measureImpacts/${measureImpactId}`)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
    });

    it("should not create a single measure impact(invalid projectId)", async () => {
        const res = await request(app)
            .post(`/api/projects/${otherProjectId}/system/measureImpacts`)
            .send({
                ...VALID_MEASURE_IMPACT_1,
                threatId,
                measureId,
            })
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
    });

    it("should not update a single measure impact (invalid projectId)", async () => {
        const res = await request(app)
            .put(`/api/projects/${otherProjectId}/system/measureImpacts/${measureImpactId}`)
            .send({
                ...VALID_MEASURE_IMPACT_1,
                threatId,
                measureId,
            })
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
    });

    it("should not delete a single measure impact (invalid projectId)", async () => {
        const res = await request(app)
            .delete("/api/projects/" + otherProjectId + "/system/measureImpacts/" + measureImpactId)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
    });
});
