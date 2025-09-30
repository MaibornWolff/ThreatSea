/**
 * Module that defines tests for the assets
 * in the database.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { db } from "#db/index.js";
import { assets, catalogs, usersCatalogs } from "#db/schema.js";
import { CONFIDENTIALITY_LEVELS } from "#types/confidentiality-levels.types.js";
import { app } from "#server.js";
import { LANGUAGES } from "#types/languages.type.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import { CreateAssetRequest } from "#types/asset.types.js";
import { CreateProjectRequest } from "#types/project.types.js";

const VALID_ASSET_1: InstanceType<typeof CreateAssetRequest> = {
    name: "Asset 1",
    description: "Description 1",
    confidentiality: 1,
    integrity: 2,
    availability: 3,
    confidentialityJustification: "confidentiality justification 1",
    integrityJustification: "integrity justification 1",
    availabilityJustification: "availability justification 1",
};

const VALID_ASSET_2: InstanceType<typeof CreateAssetRequest> = {
    name: "Asset 2",
    description: "Description 2",
    confidentiality: 3,
    integrity: 4,
    availability: 5,
    confidentialityJustification: "confidentiality justification 2",
    integrityJustification: "integrity justification 2",
    availabilityJustification: "availability justification 2",
};

const VALID_ASSET_3: InstanceType<typeof CreateAssetRequest> = {
    name: "Asset 3",
    description: "Description 3",
    confidentiality: 3,
    integrity: 4,
    availability: 5,
    confidentialityJustification: "confidentiality justification 2",
    integrityJustification: "integrity justification 2",
    availabilityJustification: "availability justification 2",
};

const CONFIDENTIALITY_TOO_BIG_ASSET: InstanceType<typeof CreateAssetRequest> = {
    name: "Asset 1",
    description: "Description 1",
    confidentiality: 6,
    integrity: 2,
    availability: 3,
    confidentialityJustification: "confidentiality justification",
    integrityJustification: "integrity justification",
    availabilityJustification: "availability justification",
};

const INTEGRITY_TOO_LOW_ASSET: InstanceType<typeof CreateAssetRequest> = {
    name: "Asset 1",
    description: "Description 1",
    confidentiality: 1,
    integrity: 0,
    availability: 3,
    confidentialityJustification: "confidentiality justification",
    integrityJustification: "integrity justification",
    availabilityJustification: "availability justification",
};

const NAME_TOO_LONG_ASSET: InstanceType<typeof CreateAssetRequest> = {
    name: "NAME TOO LONG Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata",
    description: "Description 1",
    confidentiality: 1,
    integrity: 2,
    availability: 3,
    confidentialityJustification: "confidentiality justification",
    integrityJustification: "integrity justification",
    availabilityJustification: "availability justification",
};

const VALID_PROJECT: Omit<InstanceType<typeof CreateProjectRequest>, "catalogId"> = {
    name: "Project 1",
    description: "Des 1",
    confidentialityLevel: CONFIDENTIALITY_LEVELS.INTERNAL,
};

let projectId: number;
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
    projectId = res.body.id;

    await request(app)
        .post("/projects/" + projectId + "/assets")
        .send({
            ...VALID_ASSET_3,
            projectId,
        })
        .set("X-CSRF-TOKEN", csrfToken)
        .set("Cookie", cookies);
});

describe("get or create assets", () => {
    it("should list all assets", async () => {
        const res = await request(app)
            .get("/projects/" + projectId + "/assets")
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it("should create a new asset", async () => {
        const res = await request(app)
            .post("/projects/" + projectId + "/assets")
            .send({
                ...VALID_ASSET_1,
                projectId,
            })
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
    });

    it("should not create a new asset (name missing)", async () => {
        const invalidAsset = {
            availability: VALID_ASSET_1.availability,
            description: VALID_ASSET_1.description,
            confidentiality: VALID_ASSET_1.confidentiality,
            integrity: VALID_ASSET_1.integrity,
        };
        const res = await request(app)
            .post("/projects/" + projectId + "/assets")
            .send(invalidAsset)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
        expect(res.body.validationErrors).toBeDefined();
    });

    it("should not create a new asset (name not unique)", async () => {
        const res = await request(app)
            .post("/projects/" + projectId + "/assets")
            .send(VALID_ASSET_3)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(409);
    });

    it("should not create a new asset (confidentiality > 5)", async () => {
        const res = await request(app)
            .post("/projects/" + projectId + "/assets")
            .send(CONFIDENTIALITY_TOO_BIG_ASSET)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
        expect(res.body.validationErrors).toBeDefined();
    });

    it("should not create a new asset (integrity < 1)", async () => {
        const res = await request(app)
            .post("/projects/" + projectId + "/assets")
            .send(INTEGRITY_TOO_LOW_ASSET)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
        expect(res.body.validationErrors).toBeDefined();
    });

    it("should not create a new asset (name too long)", async () => {
        const res = await request(app)
            .post("/projects/" + projectId + "/assets")
            .send(NAME_TOO_LONG_ASSET)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
        expect(res.body.validationErrors).toBeDefined();
    });
});

describe("delete or update assets", () => {
    let assetId: number;
    beforeEach(async () => {
        const asset = (
            await db
                .insert(assets)
                .values({
                    ...VALID_ASSET_1,
                    projectId,
                })
                .returning()
        ).at(0);
        assetId = asset!.id;
    });

    it("should update an asset", async () => {
        const res = await request(app)
            .put("/projects/" + projectId + "/assets/" + assetId)
            .send(VALID_ASSET_2)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
        expect(res.body.name).toBe(VALID_ASSET_2.name);
        expect(res.body.description).toBe(VALID_ASSET_2.description);
        expect(res.body.confidentiality).toBe(VALID_ASSET_2.confidentiality);
        expect(res.body.integrity).toBe(VALID_ASSET_2.integrity);
        expect(res.body.availability).toBe(VALID_ASSET_2.availability);
        expect(res.body.confidentialityJustification).toBe(VALID_ASSET_2.confidentialityJustification);
        expect(res.body.integrityJustification).toBe(VALID_ASSET_2.integrityJustification);
        expect(res.body.availabilityJustification).toBe(VALID_ASSET_2.availabilityJustification);
    });

    it("should delete an asset", async () => {
        const res = await request(app)
            .delete("/projects/" + projectId + "/assets/" + assetId)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(204);
    });
});

describe("delete or update assets(invalid data)", () => {
    let otherProjectId: number;
    let assetId: number;
    beforeEach(async () => {
        const res = await request(app)
            .post("/projects")
            .send({ ...VALID_PROJECT, catalogId })
            .set("Authorization", "Bearer fakeToken")
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        otherProjectId = res.body.id;

        const asset = (
            await db
                .insert(assets)
                .values({
                    ...VALID_ASSET_1,
                    projectId,
                })
                .returning()
        ).at(0);
        assetId = asset!.id;
    });

    it("should not update an asset (invalid projectId)", async () => {
        const res = await request(app)
            .put("/projects/" + otherProjectId + "/assets/" + assetId)
            .send({
                name: "Asset 2",
                description: "Description 2",
            })
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
    });

    it("should delete an asset (invalid projectId)", async () => {
        const res = await request(app)
            .delete("/projects/" + otherProjectId + "/assets/" + assetId)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
    });
});
