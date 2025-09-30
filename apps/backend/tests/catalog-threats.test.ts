/**
 * Module that defines tests for the catalogue threats.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { db } from "#db/index.js";
import { catalogs, catalogThreats, usersCatalogs } from "#db/schema.js";
import { ATTACKERS } from "#types/attackers.types.js";
import { POINTS_OF_ATTACK } from "#types/points-of-attack.types.js";
import { app } from "#server.js";
import { LANGUAGES } from "#types/languages.type.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import { CreateCatalogThreatRequest } from "#types/catalog-threat.types.js";
import { CreateCatalogRequest } from "#types/catalog.types.js";

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

const VALID_CATALOG_THREAT_2: InstanceType<typeof CreateCatalogThreatRequest> = {
    name: "Catalog Threat 2",
    description: "Description 2",
    pointOfAttack: POINTS_OF_ATTACK.DATA_STORAGE_INFRASTRUCTURE,
    attacker: ATTACKERS.SYSTEM_USERS,
    probability: 2,
    confidentiality: false,
    integrity: true,
    availability: false,
};

const CATALOG_THREAT_NAME_MISSING: Omit<InstanceType<typeof CreateCatalogThreatRequest>, "name"> = {
    description: "Description 2",
    pointOfAttack: POINTS_OF_ATTACK.DATA_STORAGE_INFRASTRUCTURE,
    attacker: ATTACKERS.SYSTEM_USERS,
    probability: 2,
    confidentiality: false,
    integrity: true,
    availability: false,
};

const CATALOG_THREAT_ATTACKER_MISSING: Omit<InstanceType<typeof CreateCatalogThreatRequest>, "attacker"> = {
    name: "Catalog Threat 2",
    description: "Description 2",
    pointOfAttack: POINTS_OF_ATTACK.PROCESSING_INFRASTRUCTURE,
    probability: 3,
    confidentiality: true,
    integrity: false,
    availability: false,
};

const CATALOG_THREAT_POA_MISSING: Omit<InstanceType<typeof CreateCatalogThreatRequest>, "pointOfAttack"> = {
    name: "Catalog Threat 2",
    description: "Description 2",
    attacker: ATTACKERS.SYSTEM_USERS,
    confidentiality: true,
    probability: 3,
    integrity: true,
    availability: true,
};

const CATALOG_THREAT_PROBABILITY_MISSING: Omit<InstanceType<typeof CreateCatalogThreatRequest>, "probability"> = {
    name: "Catalog Threat 2",
    description: "Description 2",
    attacker: ATTACKERS.SYSTEM_USERS,
    pointOfAttack: POINTS_OF_ATTACK.PROCESSING_INFRASTRUCTURE,
    confidentiality: true,
    integrity: true,
    availability: true,
};

const VALID_CATALOG_1: InstanceType<typeof CreateCatalogRequest> = {
    name: "Catalog 1",
    language: LANGUAGES.EN,
    defaultContent: true,
};

let catalogId: number;
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
    catalogId = catalog.id;

    const authRes = await request(app).get("/auth/status").set("X-CSRF-TOKEN", csrfToken).set("Cookie", cookies);
    const userId = authRes.body.data.userId;

    await db.insert(usersCatalogs).values({
        userId,
        catalogId,
        role: USER_ROLES.OWNER,
    });
});

describe("get or create catalog threats", () => {
    it("should list all catalog threats", async () => {
        const res = await request(app)
            .get("/catalogs/" + catalogId + "/threats")
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it("should create a new catalog threat", async () => {
        const res = await request(app)
            .post("/catalogs/" + catalogId + "/threats")
            .send(VALID_CATALOG_THREAT_1)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
        expect(res.body.name).toBe(VALID_CATALOG_THREAT_1.name);
        expect(res.body.description).toBe(VALID_CATALOG_THREAT_1.description);
        expect(res.body.attacker).toBe(VALID_CATALOG_THREAT_1.attacker);
        expect(res.body.pointOfAttack).toBe(VALID_CATALOG_THREAT_1.pointOfAttack);
        expect(res.body.confidentiality).toBe(VALID_CATALOG_THREAT_1.confidentiality);
        expect(res.body.integrity).toBe(VALID_CATALOG_THREAT_1.integrity);
        expect(res.body.availability).toBe(VALID_CATALOG_THREAT_1.availability);
    });

    it("should not create a new catalog threat (name missing)", async () => {
        const res = await request(app)
            .post("/catalogs/" + catalogId + "/threats")
            .send(CATALOG_THREAT_NAME_MISSING)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
        expect(res.body.validationErrors).toBeDefined();
    });

    it("should not create a new catalog threat (attacker missing)", async () => {
        const res = await request(app)
            .post("/catalogs/" + catalogId + "/threats")
            .send(CATALOG_THREAT_ATTACKER_MISSING)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
        expect(res.body.validationErrors).toBeDefined();
    });

    it("should not create a new catalog threat (point of attack missing)", async () => {
        const res = await request(app)
            .post("/catalogs/" + catalogId + "/threats")
            .send(CATALOG_THREAT_POA_MISSING)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
        expect(res.body.validationErrors).toBeDefined();
    });

    it("should not create a new catalog threat (probability missing)", async () => {
        const res = await request(app)
            .post("/catalogs/" + catalogId + "/threats")
            .send(CATALOG_THREAT_PROBABILITY_MISSING)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
        expect(res.body.validationErrors).toBeDefined();
    });
});

describe("delete or update catalog threats", () => {
    let catalogThreatId: number;
    beforeEach(async () => {
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
    });

    it("should update a catalog threat", async () => {
        const res = await request(app)
            .put("/catalogs/" + catalogId + "/threats/" + catalogThreatId)
            .send(VALID_CATALOG_THREAT_2)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
        expect(res.body.name).toBe(VALID_CATALOG_THREAT_2.name);
        expect(res.body.description).toBe(VALID_CATALOG_THREAT_2.description);
        expect(res.body.pointOfAttack).toBe(VALID_CATALOG_THREAT_2.pointOfAttack);
        expect(res.body.attacker).toBe(VALID_CATALOG_THREAT_2.attacker);
        expect(res.body.confidentiality).toBe(VALID_CATALOG_THREAT_2.confidentiality);
        expect(res.body.integrity).toBe(VALID_CATALOG_THREAT_2.integrity);
        expect(res.body.availability).toBe(VALID_CATALOG_THREAT_2.availability);
    });

    it("should delete a catalog threat", async () => {
        const res = await request(app)
            .delete("/catalogs/" + catalogId + "/threats/" + catalogThreatId)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(204);
    });
});

describe("delete or update catalog threats (invalid data)", () => {
    let otherCatalogId: number;
    let catalogThreatId: number;
    beforeEach(async () => {
        const res = await request(app)
            .post("/catalogs")
            .send(VALID_CATALOG_1)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        otherCatalogId = res.body.id;

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
    });

    it("should not update a catalog threat(invalid catalogId)", async () => {
        const res = await request(app)
            .put("/catalogs/" + otherCatalogId + "/threats/" + catalogThreatId)
            .send(CATALOG_THREAT_NAME_MISSING)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
    });

    it("should not delete a catalog threat(invalid catalogId)", async () => {
        const res = await request(app)
            .delete("/catalogs/" + otherCatalogId + "/threats/" + catalogThreatId)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
    });
});
