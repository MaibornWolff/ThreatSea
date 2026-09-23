/**
 * Module that defines tests for the report.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { db } from "#db/index.js";
import { assets, catalogs, threats, usersCatalogs } from "#db/schema.js";
import { CONFIDENTIALITY_LEVELS } from "#types/confidentiality-levels.types.js";
import { app } from "#server.js";
import { LANGUAGES } from "#types/languages.type.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import { CreateProjectRequest } from "#types/project.types.js";
import { POINTS_OF_ATTACK } from "#types/points-of-attack.types.js";
import { ATTACKERS } from "#types/attackers.types.js";
import { THREAT_STATUSES } from "#types/threat-statuses.types.js";
import type { PointOfAttack, SystemData } from "#types/system.types.js";
import { updateSystem } from "#services/updateSystem.service.js";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

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

describe("report risk of out-of-scope threats", () => {
    const POA_TYPE = POINTS_OF_ATTACK.COMMUNICATION_INTERFACES;

    // Catalogue threat affecting confidentiality and availability, so the asset's integrity
    // rating is deliberately ignored by the damage calculation.
    const CATALOG_THREAT = {
        name: "Catalog Threat 1",
        description: "Description 1",
        pointOfAttack: POA_TYPE,
        attacker: ATTACKERS.ADMINISTRATORS,
        probability: 2,
        confidentiality: true,
        integrity: false,
        availability: true,
    };

    // Exposing a point of attack that carries an asset makes updateSystem generate the parent
    // threat and its first child, which is the threat the report renders.
    const seedThreatWithAsset = async () => {
        await request(app)
            .post("/api/catalogs/" + catalogId + "/threats")
            .send(CATALOG_THREAT)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);

        const asset = (
            await db
                .insert(assets)
                .values({
                    name: "Asset 1",
                    description: "",
                    confidentiality: 4,
                    integrity: 5,
                    availability: 1,
                    confidentialityJustification: "",
                    integrityJustification: "",
                    availabilityJustification: "",
                    projectId,
                })
                .returning()
        ).at(0)!;

        const pointOfAttack: PointOfAttack = {
            id: nanoid(),
            name: null,
            type: POA_TYPE,
            componentId: null,
            connectionId: null,
            projectId,
            connectionPointId: null,
            assets: [asset.id],
        };
        const data: SystemData = {
            connections: [],
            components: [],
            pointsOfAttack: [pointOfAttack],
            connectionPoints: [],
            lastAutoSaveDate: new Date().toISOString(),
        };

        await updateSystem(projectId, { data });
    };

    const getReportThreat = async () => {
        const res = await request(app)
            .get("/api/projects/" + projectId + "/report")
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);

        expect(res.statusCode).toEqual(200);
        expect(res.body.threats).toHaveLength(1);

        return res.body.threats[0];
    };

    it("reports the net risk of an in-scope threat", async () => {
        await seedThreatWithAsset();

        const threat = await getReportThreat();

        // Probability 2, damage 4 (the asset's confidentiality; its integrity does not apply).
        expect(threat.risk).toEqual(8);
        expect(threat.netProbability).toEqual(2);
        expect(threat.netDamage).toEqual(4);
        expect(threat.netRisk).toEqual(8);
    });

    it("reports no net risk for a threat a user put out of scope, keeping the gross risk", async () => {
        await seedThreatWithAsset();
        await db.update(threats).set({ status: THREAT_STATUSES.OUTOFSCOPE }).where(eq(threats.projectId, projectId));

        const threat = await getReportThreat();

        expect(threat.netProbability).toEqual(0);
        expect(threat.netDamage).toEqual(0);
        expect(threat.netRisk).toEqual(0);
        expect(threat.probability).toEqual(2);
        expect(threat.damage).toEqual(4);
        expect(threat.risk).toEqual(8);
    });
});
