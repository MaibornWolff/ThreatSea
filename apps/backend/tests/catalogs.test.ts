/**
 * Module that defines tests for catalogues.
 */
import request from "supertest";
import { app } from "#server.js";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CreateCatalogRequest } from "#types/catalog.types.js";
import { LANGUAGES } from "#types/languages.type.js";

const VALID_CATALOG_DEFAULT: InstanceType<typeof CreateCatalogRequest> = {
    name: "Catalog 1",
    language: LANGUAGES.EN,
    defaultContent: true,
};

const VALID_CATALOG_EMPTY: InstanceType<typeof CreateCatalogRequest> = {
    name: "Catalog 2",
    language: LANGUAGES.DE,
    defaultContent: false,
};

const VALID_CATALOG: Omit<InstanceType<typeof CreateCatalogRequest>, "defaultContent"> = {
    name: "Catalog 3",
    language: LANGUAGES.DE,
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

describe("catalog tests", () => {
    describe("get or create catalogs", () => {
        it("should list all catalogs", async () => {
            const res = await request(app).get("/catalogs").set("X-CSRF-TOKEN", csrfToken).set("Cookie", cookies);
            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        it("should not get a specific catalog (invalid catalogId)", async () => {
            const res = await request(app)
                .get("/catalogs/999999")
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(res.statusCode).toEqual(404);
        });

        it("should create a new default catalog", async () => {
            const res = await request(app)
                .post("/catalogs")
                .send(VALID_CATALOG_DEFAULT)
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(res.statusCode).toEqual(200);
            expect(res.body.name).toEqual(VALID_CATALOG_DEFAULT.name);
            expect(res.body.language).toEqual(VALID_CATALOG_DEFAULT.language);

            const catalogId = res.body.id;

            const threatRes = await request(app)
                .get(`/catalogs/${catalogId}/threats`)
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(threatRes.statusCode).toEqual(200);
            expect(threatRes.body).toBeInstanceOf(Array);
            expect(threatRes.body.length).toBeGreaterThan(0);

            const measureRes = await request(app)
                .get(`/catalogs/${catalogId}/measures`)
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(measureRes.statusCode).toEqual(200);
            expect(measureRes.body).toBeInstanceOf(Array);
            expect(measureRes.body.length).toBeGreaterThan(0);
        });

        it("should create a new empty catalog", async () => {
            const res = await request(app)
                .post("/catalogs")
                .send(VALID_CATALOG_EMPTY)
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(res.statusCode).toEqual(200);
            expect(res.body.name).toEqual(VALID_CATALOG_EMPTY.name);
            expect(res.body.language).toEqual(VALID_CATALOG_EMPTY.language);

            const catalogId = res.body.id;

            const threatRes = await request(app)
                .get(`/catalogs/${catalogId}/threats`)
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(threatRes.statusCode).toEqual(200);
            expect(threatRes.body).toBeInstanceOf(Array);
            expect(threatRes.body.length).toEqual(0);

            const measureRes = await request(app)
                .get(`/catalogs/${catalogId}/measures`)
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(measureRes.statusCode).toEqual(200);
            expect(measureRes.body).toBeInstanceOf(Array);
            expect(measureRes.body.length).toEqual(0);
        });

        it("should create a new empty catalog (defaultContent missing)", async () => {
            const res = await request(app)
                .post("/catalogs")
                .send(VALID_CATALOG)
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(res.statusCode).toEqual(200);
            expect(res.body.name).toEqual(VALID_CATALOG.name);
            expect(res.body.language).toEqual(VALID_CATALOG.language);

            const catalogId = res.body.id;

            const threatRes = await request(app)
                .get(`/catalogs/${catalogId}/threats`)
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(threatRes.statusCode).toEqual(200);
            expect(threatRes.body).toBeInstanceOf(Array);
            expect(threatRes.body.length).toEqual(0);

            const measureRes = await request(app)
                .get(`/catalogs/${catalogId}/measures`)
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(measureRes.statusCode).toEqual(200);
            expect(measureRes.body).toBeInstanceOf(Array);
            expect(measureRes.body.length).toEqual(0);
        });

        it("should not create a new catalog (name missing)", async () => {
            const invalidCatalog = { language: VALID_CATALOG_DEFAULT.language };
            const res = await request(app)
                .post("/catalogs")
                .send(invalidCatalog)
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(res.statusCode).toEqual(400);
        });
    });

    describe("get, delete or update catalogs", () => {
        let catalogId: number;
        beforeEach(async () => {
            const res = await request(app)
                .post("/catalogs")
                .send(VALID_CATALOG_DEFAULT)
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            catalogId = res.body.id;
        });

        it("should get a single catalog", async () => {
            const res = await request(app)
                .get("/catalogs/" + catalogId)
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(res.statusCode).toEqual(200);
            expect(res.body.name).toBe(VALID_CATALOG_DEFAULT.name);
        });

        it("should update a catalog", async () => {
            const res = await request(app)
                .put("/catalogs/" + catalogId)
                .send(VALID_CATALOG_EMPTY)
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(res.statusCode).toEqual(200);
            expect(res.body.name).toBe(VALID_CATALOG_EMPTY.name);
        });

        it("should delete a catalog", async () => {
            const res = await request(app)
                .delete("/catalogs/" + catalogId)
                .set("X-CSRF-TOKEN", csrfToken)
                .set("Cookie", cookies);
            expect(res.statusCode).toEqual(204);
        });
    });
});
