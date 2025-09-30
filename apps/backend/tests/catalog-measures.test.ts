/**
 * Module that defines tests for the
 * catalogue measures.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { db } from "#db/index.js";
import { catalogMeasures, catalogs, CreateCatalog, usersCatalogs } from "#db/schema.js";
import { ATTACKERS } from "#types/attackers.types.js";
import { POINTS_OF_ATTACK } from "#types/points-of-attack.types.js";
import { app } from "#server.js";
import { LANGUAGES } from "#types/languages.type.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import { CreateCatalogMeasureRequest } from "#types/catalog-measure.types.js";

const VALID_CATALOG_MEASURE_1: InstanceType<typeof CreateCatalogMeasureRequest> = {
    name: "Catalog Measure 1",
    description: "Description 1",
    attacker: ATTACKERS.UNAUTHORIZED_PARTIES,
    pointOfAttack: POINTS_OF_ATTACK.COMMUNICATION_INFRASTRUCTURE,
    probability: 1,
    confidentiality: false,
    integrity: false,
    availability: true,
};

const VALID_CATALOG_MEASURE_2: InstanceType<typeof CreateCatalogMeasureRequest> = {
    name: "Catalog Measure 2",
    description: "Description 2",
    attacker: ATTACKERS.APPLICATION_USERS,
    pointOfAttack: POINTS_OF_ATTACK.PROCESSING_INFRASTRUCTURE,
    confidentiality: true,
    integrity: true,
    availability: false,
    probability: 4,
};

const VALID_CATALOG_MEASURE_3: InstanceType<typeof CreateCatalogMeasureRequest> = {
    name: "Catalog Measure 3",
    description: "Description 2",
    attacker: ATTACKERS.APPLICATION_USERS,
    pointOfAttack: POINTS_OF_ATTACK.PROCESSING_INFRASTRUCTURE,
    confidentiality: true,
    integrity: true,
    availability: false,
    probability: 4,
};

const CATALOG_MEASURE_NAME_MISSING: Omit<InstanceType<typeof CreateCatalogMeasureRequest>, "name"> = {
    description: "Description 2",
    attacker: ATTACKERS.APPLICATION_USERS,
    pointOfAttack: POINTS_OF_ATTACK.PROCESSING_INFRASTRUCTURE,
    confidentiality: true,
    integrity: false,
    availability: false,
    probability: 1,
};

const CATALOG_MEASURE_ATTACKER_MISSING: Omit<InstanceType<typeof CreateCatalogMeasureRequest>, "attacker"> = {
    name: "Catalog Measure 2",
    description: "Description 2",
    pointOfAttack: POINTS_OF_ATTACK.PROCESSING_INFRASTRUCTURE,
    confidentiality: true,
    integrity: false,
    availability: false,
    probability: 1,
};

const CATALOG_MEASURE_POA_MISSING: Omit<InstanceType<typeof CreateCatalogMeasureRequest>, "pointOfAttack"> = {
    name: "Catalog Measure 2",
    description: "Description 2",
    attacker: ATTACKERS.SYSTEM_USERS,
    confidentiality: true,
    integrity: true,
    availability: true,
    probability: 1,
};

const CATALOG_MEASURE_PROBABILITY_MISSING: Omit<InstanceType<typeof CreateCatalogMeasureRequest>, "probability"> = {
    name: "Catalog Measure 2",
    description: "Description 2",
    attacker: ATTACKERS.SYSTEM_USERS,
    pointOfAttack: POINTS_OF_ATTACK.PROCESSING_INFRASTRUCTURE,
    confidentiality: true,
    integrity: true,
    availability: true,
};

const VALID_CATALOG: CreateCatalog = {
    name: "Catalog 1",
    language: LANGUAGES.EN,
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

    await request(app)
        .post("/catalogs/" + catalogId + "/measures")
        .send(VALID_CATALOG_MEASURE_3)
        .set("X-CSRF-TOKEN", csrfToken)
        .set("Cookie", cookies);
}, 50000);

describe("get or create catalog measures", () => {
    it("should get all catalog measure", async () => {
        const res = await request(app)
            .get("/catalogs/" + catalogId + "/measures")
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
    });

    it("should create a new catalog measure", async () => {
        const res = await request(app)
            .post("/catalogs/" + catalogId + "/measures")
            .send(VALID_CATALOG_MEASURE_1)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
        expect(res.body.name).toBe(VALID_CATALOG_MEASURE_1.name);
        expect(res.body.description).toBe(VALID_CATALOG_MEASURE_1.description);
        expect(res.body.attacker).toBe(VALID_CATALOG_MEASURE_1.attacker);
        expect(res.body.pointOfAttack).toBe(VALID_CATALOG_MEASURE_1.pointOfAttack);
        expect(res.body.confidentiality).toBe(VALID_CATALOG_MEASURE_1.confidentiality);
        expect(res.body.integrity).toBe(VALID_CATALOG_MEASURE_1.integrity);
        expect(res.body.availability).toBe(VALID_CATALOG_MEASURE_1.availability);
        expect(res.body.probability).toBe(VALID_CATALOG_MEASURE_1.probability);
    });

    it("should not create a new catalog measure (name missing)", async () => {
        const res = await request(app)
            .post("/catalogs/" + catalogId + "/measures")
            .send(CATALOG_MEASURE_NAME_MISSING)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
        expect(res.body.validationErrors).toBeDefined();
    });

    it("should not create a new catalog measure (attacker missing)", async () => {
        const res = await request(app)
            .post("/catalogs/" + catalogId + "/measures")
            .send(CATALOG_MEASURE_ATTACKER_MISSING)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
        expect(res.body.validationErrors).toBeDefined();
    });

    it("should not create a new catalog measure (attacker missing)", async () => {
        const res = await request(app)
            .post("/catalogs/" + catalogId + "/measures")
            .send(CATALOG_MEASURE_POA_MISSING)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
        expect(res.body.validationErrors).toBeDefined();
    });

    it("should not create a new catalog measure (probability missing)", async () => {
        const res = await request(app)
            .post("/catalogs/" + catalogId + "/measures")
            .send(CATALOG_MEASURE_PROBABILITY_MISSING)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
        expect(res.body.validationErrors).toBeDefined();
    });

    it("should import a new catalog measure", async () => {
        const res = await request(app)
            .post("/catalogs/" + catalogId + "/measures/import")
            .send([VALID_CATALOG_MEASURE_1])
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.status).toBe(200);
    });
});

describe("delete or update catalog measures", () => {
    let catalogThreatId: number;
    beforeEach(async () => {
        const catalogMeasure = (
            await db
                .insert(catalogMeasures)
                .values({
                    ...VALID_CATALOG_MEASURE_1,
                    catalogId,
                })
                .returning()
        ).at(0);
        catalogThreatId = catalogMeasure!.id;
    });

    it("should update a catalog measure", async () => {
        const res = await request(app)
            .put("/catalogs/" + catalogId + "/measures/" + catalogThreatId)
            .send(VALID_CATALOG_MEASURE_2)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
        expect(res.body.name).toBe(VALID_CATALOG_MEASURE_2.name);
        expect(res.body.description).toBe(VALID_CATALOG_MEASURE_2.description);
        expect(res.body.attacker).toBe(VALID_CATALOG_MEASURE_2.attacker);
        expect(res.body.confidentiality).toBe(VALID_CATALOG_MEASURE_2.confidentiality);
        expect(res.body.integrity).toBe(VALID_CATALOG_MEASURE_2.integrity);
        expect(res.body.availability).toBe(VALID_CATALOG_MEASURE_2.availability);
        expect(res.body.probability).toBe(VALID_CATALOG_MEASURE_2.probability);
    });

    it("should delete a catalog measure", async () => {
        const res = await request(app)
            .delete("/catalogs/" + catalogId + "/measures/" + catalogThreatId)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(204);
    });
});

describe("delete or update catalog measures (invalid data)", () => {
    let otherCatalogId: number;
    let catalogMeasureId: number;
    beforeEach(async () => {
        const catalog = (
            await db
                .insert(catalogs)
                .values({
                    ...VALID_CATALOG,
                })
                .returning()
        ).at(0);
        otherCatalogId = catalog!.id;

        const authRes = await request(app).get("/auth/status").set("X-CSRF-TOKEN", csrfToken).set("Cookie", cookies);
        const userId = authRes.body.data.userId;

        await db.insert(usersCatalogs).values({
            userId,
            catalogId: otherCatalogId,
            role: USER_ROLES.OWNER,
        });

        const catalogMeasure = (
            await db
                .insert(catalogMeasures)
                .values({
                    ...VALID_CATALOG_MEASURE_1,
                    catalogId: catalogId,
                })
                .returning()
        ).at(0);
        catalogMeasureId = catalogMeasure!.id;
    });

    it("should not update a catalog measure (invalid catalogId)", async () => {
        const res = await request(app)
            .put("/catalogs/" + otherCatalogId + "/measures/" + catalogMeasureId)
            .send({ ...VALID_CATALOG_MEASURE_2 })
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
    });
});
