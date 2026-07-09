/**
 * Module that defines test for the threats.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { nanoid } from "nanoid";
import { db } from "#db/index.js";
import { catalogs, childThreats, CreateChildThreat, genericThreats, usersCatalogs } from "#db/schema.js";
import { POINTS_OF_ATTACK } from "#types/points-of-attack.types.js";
import { ATTACKERS } from "#types/attackers.types.js";
import { CONFIDENTIALITY_LEVELS } from "#types/confidentiality-levels.types.js";
import { app } from "#server.js";
import { LANGUAGES } from "#types/languages.type.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import { CreateCatalogThreatRequest } from "#types/catalog-threat.types.js";
import { CreateGenericThreatRequest } from "#types/genericThreat.types.js";
import { UpdateChildThreatRequest } from "#types/childThreat.types.js";
import { CHILD_THREAT_STATUSES } from "#types/child-threat-statuses.types.js";

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

const VALID_GENERIC_THREAT_1: Omit<InstanceType<typeof CreateGenericThreatRequest>, "catalogThreatId"> = {
    pointOfAttackId: nanoid(),
    name: "Generic Threat 1",
    description: "Generic description 1",
    pointOfAttack: POINTS_OF_ATTACK.COMMUNICATION_INTERFACES,
    attacker: ATTACKERS.ADMINISTRATORS,
};

// Seed data for direct db inserts; the create endpoint itself only accepts refinement fields.
const VALID_CHILD_THREAT_1: Omit<CreateChildThreat, "genericThreatId" | "projectId"> = {
    pointOfAttackId: nanoid(),
    name: "Valid child threat 1",
    description: "Valid description test 1",
    pointOfAttack: POINTS_OF_ATTACK.COMMUNICATION_INTERFACES,
    attacker: ATTACKERS.ADMINISTRATORS,
    probability: 2,
    confidentiality: true,
    integrity: true,
    availability: false,
    status: CHILD_THREAT_STATUSES.NEW,
};

const CREATE_CHILD_THREAT_BODY: InstanceType<typeof UpdateChildThreatRequest> = {
    name: "Refined child threat",
    description: "Refined description",
    probability: 4,
    confidentiality: false,
    integrity: true,
    availability: true,
    status: CHILD_THREAT_STATUSES.NEW,
};

const VALID_UPDATE_CHILD_THREAT: InstanceType<typeof UpdateChildThreatRequest> = {
    name: "Valid child threat 2",
    description: "Valid description test 2",
    probability: 3,
    confidentiality: false,
    integrity: false,
    availability: true,
    status: CHILD_THREAT_STATUSES.IN_PROGRESS,
};

const INVALID_CHILD_THREAT_NAME_MISSING: Omit<InstanceType<typeof UpdateChildThreatRequest>, "name"> = {
    description: "Valid description test test",
    probability: 3,
    confidentiality: false,
    integrity: true,
    availability: false,
    status: CHILD_THREAT_STATUSES.NEW,
};

const INVALID_CHILD_THREAT_PROB_TOO_HIGH: InstanceType<typeof UpdateChildThreatRequest> = {
    name: "Valid child threat",
    description: "Valid description test test",
    probability: 6,
    confidentiality: true,
    integrity: true,
    availability: false,
    status: CHILD_THREAT_STATUSES.NEW,
};

const INVALID_CHILD_THREAT_PROB_TOO_LOW: InstanceType<typeof UpdateChildThreatRequest> = {
    name: "Valid child threat",
    description: "Valid description test test",
    probability: 0,
    confidentiality: true,
    integrity: true,
    availability: false,
    status: CHILD_THREAT_STATUSES.NEW,
};

let projectId: number;
let catalogThreatId: number;
let genericThreatId: number;
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
                name: "Catalog 1",
                language: LANGUAGES.EN,
            })
            .returning()
    ).at(0)!;
    const catalogId = catalog.id;

    const authRes = await request(app).get("/api/auth/status").set("X-CSRF-TOKEN", csrfToken).set("Cookie", cookies);
    const userId = authRes.body.data.userId;

    await db.insert(usersCatalogs).values({
        userId,
        catalogId,
        role: USER_ROLES.OWNER,
    });

    const threatRes = await request(app)
        .post("/api/catalogs/" + catalogId + "/threats")
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
        .post("/api/projects")
        .send({ ...VALID_PROJECT, catalogId })
        .set("X-CSRF-TOKEN", csrfToken)
        .set("Cookie", cookies);
    projectId = projectRes.body.id;

    const genericThreat = (
        await db
            .insert(genericThreats)
            .values({
                ...VALID_GENERIC_THREAT_1,
                catalogThreatId,
                projectId,
            })
            .returning()
    ).at(0)!;
    genericThreatId = genericThreat.id;

    await db.insert(childThreats).values({
        ...VALID_CHILD_THREAT_1,
        genericThreatId,
        projectId,
    });
});

describe("get or create threats", () => {
    it("should list all threats", async () => {
        const res = await request(app)
            .get(`/api/projects/${projectId}/system/genericThreats`)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        expect(Array.isArray(res.body[0].children)).toBe(true);
    });

    it("should return an empty list for a generic threat without children", async () => {
        const childlessGenericThreat = (
            await db
                .insert(genericThreats)
                .values({
                    ...VALID_GENERIC_THREAT_1,
                    pointOfAttackId: nanoid(),
                    catalogThreatId,
                    projectId,
                })
                .returning()
        ).at(0)!;

        const res = await request(app)
            .get(`/api/projects/${projectId}/system/childThreats/${childlessGenericThreat.id}/list`)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual([]);
    });

    it("should create a threat inheriting identity from its parent", async () => {
        const res = await request(app)
            .post(`/api/projects/${projectId}/system/childThreats/${genericThreatId}`)
            .send(CREATE_CHILD_THREAT_BODY)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(201);

        expect(res.body.name).toBe(CREATE_CHILD_THREAT_BODY.name);
        expect(res.body.description).toBe(CREATE_CHILD_THREAT_BODY.description);
        expect(res.body.confidentiality).toBe(CREATE_CHILD_THREAT_BODY.confidentiality);
        expect(res.body.status).toBe(CREATE_CHILD_THREAT_BODY.status);
        expect(res.body.genericThreatId).toBe(genericThreatId);
        // Identity comes from the parent generic threat, not the request
        expect(res.body.pointOfAttack).toBe(VALID_GENERIC_THREAT_1.pointOfAttack);
        expect(res.body.pointOfAttackId).toBe(VALID_GENERIC_THREAT_1.pointOfAttackId);
        expect(res.body.attacker).toBe(VALID_GENERIC_THREAT_1.attacker);
    });

    it("should ignore client-supplied identity fields on create", async () => {
        const res = await request(app)
            .post(`/api/projects/${projectId}/system/childThreats/${genericThreatId}`)
            .send({
                ...CREATE_CHILD_THREAT_BODY,
                pointOfAttackId: "spoofed-poa-id",
                pointOfAttack: POINTS_OF_ATTACK.DATA_STORAGE_INFRASTRUCTURE,
                attacker: ATTACKERS.SYSTEM_USERS,
                genericThreatId: genericThreatId + 1000,
            })
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(201);

        expect(res.body.genericThreatId).toBe(genericThreatId);
        expect(res.body.pointOfAttack).toBe(VALID_GENERIC_THREAT_1.pointOfAttack);
        expect(res.body.pointOfAttackId).toBe(VALID_GENERIC_THREAT_1.pointOfAttackId);
        expect(res.body.attacker).toBe(VALID_GENERIC_THREAT_1.attacker);
    });

    it("should create a threat from parent and catalog defaults when the body is empty", async () => {
        const res = await request(app)
            .post(`/api/projects/${projectId}/system/childThreats/${genericThreatId}`)
            .send({})
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(201);

        // Identity text defaults to the parent generic threat
        expect(res.body.name).toBe(VALID_GENERIC_THREAT_1.name);
        expect(res.body.description).toBe(VALID_GENERIC_THREAT_1.description);
        expect(res.body.pointOfAttack).toBe(VALID_GENERIC_THREAT_1.pointOfAttack);
        expect(res.body.pointOfAttackId).toBe(VALID_GENERIC_THREAT_1.pointOfAttackId);
        expect(res.body.attacker).toBe(VALID_GENERIC_THREAT_1.attacker);
        // Assessment defaults to the catalogue threat
        expect(res.body.probability).toBe(VALID_CATALOG_THREAT_1.probability);
        expect(res.body.confidentiality).toBe(VALID_CATALOG_THREAT_1.confidentiality);
        expect(res.body.integrity).toBe(VALID_CATALOG_THREAT_1.integrity);
        expect(res.body.availability).toBe(VALID_CATALOG_THREAT_1.availability);
        expect(res.body.status).toBe(CHILD_THREAT_STATUSES.NEW);
    });

    it("should apply partial refinement overrides on top of the defaults", async () => {
        const res = await request(app)
            .post(`/api/projects/${projectId}/system/childThreats/${genericThreatId}`)
            .send({ name: "Generic Threat 1 (new)" })
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(201);

        expect(res.body.name).toBe("Generic Threat 1 (new)");
        expect(res.body.description).toBe(VALID_GENERIC_THREAT_1.description);
        expect(res.body.probability).toBe(VALID_CATALOG_THREAT_1.probability);
    });

    it("should not create a threat (name present but empty)", async () => {
        const res = await request(app)
            .post(`/api/projects/${projectId}/system/childThreats/${genericThreatId}`)
            .send({ ...INVALID_CHILD_THREAT_NAME_MISSING, name: "   " })
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
        expect(res.body.validationErrors).toBeDefined();
    });

    it("should not create a threat (probability too high)", async () => {
        const res = await request(app)
            .post(`/api/projects/${projectId}/system/childThreats/${genericThreatId}`)
            .send(INVALID_CHILD_THREAT_PROB_TOO_HIGH)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
        expect(res.body.validationErrors).toBeDefined();
    });

    it("should not create a threat (probability too low)", async () => {
        const res = await request(app)
            .post(`/api/projects/${projectId}/system/childThreats/${genericThreatId}`)
            .send(INVALID_CHILD_THREAT_PROB_TOO_LOW)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
        expect(res.body.validationErrors).toBeDefined();
    });
});

describe("get, delete or update a single threat", () => {
    let childThreatId: number;
    beforeEach(async () => {
        const threat = (
            await db
                .insert(childThreats)
                .values({
                    ...VALID_CHILD_THREAT_1,
                    genericThreatId,
                    projectId,
                })
                .returning()
        ).at(0);
        childThreatId = threat!.id;
    });

    it("should get a single threat", async () => {
        const res = await request(app)
            .get(`/api/projects/${projectId}/system/childThreats/${childThreatId}`)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
        expect(res.body.name).toBe(VALID_CHILD_THREAT_1.name);
    });

    it("should update a threat", async () => {
        const res = await request(app)
            .put("/api/projects/" + projectId + "/system/childThreats/" + childThreatId)
            .send(VALID_UPDATE_CHILD_THREAT)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
        expect(res.body.name).toBe(VALID_UPDATE_CHILD_THREAT.name);
        expect(res.body.description).toBe(VALID_UPDATE_CHILD_THREAT.description);
        expect(res.body.attacker).toBe(VALID_CHILD_THREAT_1.attacker);
        expect(res.body.pointOfAttack).toBe(VALID_CHILD_THREAT_1.pointOfAttack);
        expect(res.body.probability).toBe(VALID_UPDATE_CHILD_THREAT.probability);
        expect(res.body.status).toBe(VALID_UPDATE_CHILD_THREAT.status);
    });

    it("should ignore client-supplied identity fields on update", async () => {
        const res = await request(app)
            .put("/api/projects/" + projectId + "/system/childThreats/" + childThreatId)
            .send({
                ...VALID_UPDATE_CHILD_THREAT,
                pointOfAttackId: "spoofed-poa-id",
                pointOfAttack: POINTS_OF_ATTACK.DATA_STORAGE_INFRASTRUCTURE,
                attacker: ATTACKERS.SYSTEM_USERS,
                genericThreatId: genericThreatId + 1000,
            })
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);

        expect(res.body.name).toBe(VALID_UPDATE_CHILD_THREAT.name);
        expect(res.body.genericThreatId).toBe(genericThreatId);
        expect(res.body.pointOfAttack).toBe(VALID_CHILD_THREAT_1.pointOfAttack);
        expect(res.body.pointOfAttackId).toBe(VALID_CHILD_THREAT_1.pointOfAttackId);
        expect(res.body.attacker).toBe(VALID_CHILD_THREAT_1.attacker);
    });

    it("should delete a threat", async () => {
        const res = await request(app)
            .delete("/api/projects/" + projectId + "/system/childThreats/" + childThreatId)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(204);
    });
});
