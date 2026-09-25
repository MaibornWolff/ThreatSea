/**
 * Tests for the updateSystem generic threat/threat generation flow (the core of #396):
 * exposing a point of attack creates immutable generic threats; assigning assets creates
 * the first threat; re-saving does not duplicate threats; a point of attack that has assets but no
 * threats gets one regenerated; and removing a point of attack cascades its threats away.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { nanoid } from "nanoid";
import { db } from "#db/index.js";
import { assets, catalogs, catalogThreats, genericThreats, threats, usersCatalogs } from "#db/schema.js";
import { app } from "#server.js";
import { eq } from "drizzle-orm";
import { LANGUAGES } from "#types/languages.type.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import { POINTS_OF_ATTACK } from "#types/points-of-attack.types.js";
import { ATTACKERS } from "#types/attackers.types.js";
import { CONFIDENTIALITY_LEVELS } from "#types/confidentiality-levels.types.js";
import type { PointOfAttack, SystemData } from "#types/system.types.js";
import { updateSystem } from "#services/updateSystem.service.js";
import {
    getGenericThreatsByProjectId,
    getGenericThreatsWithExtendedThreats,
} from "#services/generic-threats.service.js";
import { getThreatsByGenericThreatId } from "#services/threats.service.js";

const POA_TYPE = POINTS_OF_ATTACK.COMMUNICATION_INTERFACES;

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

let projectId: number;
let catalogId: number;
let cookies: string[];
let csrfToken: string;

beforeAll(async () => {
    const csrfRes = await request(app).get("/api/csrf-token");
    csrfToken = csrfRes.body.token;
    const setCookieHeader = csrfRes.headers["set-cookie"];
    cookies = setCookieHeader !== undefined ? [setCookieHeader] : [];
    cookies = [...cookies, "accessToken=fakeaccessToken"];
    expect(csrfRes.status).toBe(200);
});

// Fresh project (the project endpoint creates its empty system) on a catalog with exactly one
// catalog threat matching POA_TYPE, so threat generation is deterministic (one generic threat per exposed
// point of attack).
beforeEach(async () => {
    const catalog = (await db.insert(catalogs).values({ name: "Catalog", language: LANGUAGES.EN }).returning()).at(0)!;
    catalogId = catalog.id;

    const authRes = await request(app).get("/api/auth/status").set("X-CSRF-TOKEN", csrfToken).set("Cookie", cookies);
    const userId = authRes.body.data.userId;
    await db.insert(usersCatalogs).values({ userId, catalogId: catalog.id, role: USER_ROLES.OWNER });

    await request(app)
        .post("/api/catalogs/" + catalog.id + "/threats")
        .send(CATALOG_THREAT)
        .set("X-CSRF-TOKEN", csrfToken)
        .set("Cookie", cookies);

    const projectRes = await request(app)
        .post("/api/projects")
        .send({
            name: "Project",
            description: "d",
            confidentialityLevel: CONFIDENTIALITY_LEVELS.INTERNAL,
            catalogId: catalog.id,
        })
        .set("X-CSRF-TOKEN", csrfToken)
        .set("Cookie", cookies);
    projectId = projectRes.body.id;
});

const makePointOfAttack = (id: string, assets: number[]): PointOfAttack => ({
    id,
    name: null,
    type: POA_TYPE,
    componentId: null,
    connectionId: null,
    projectId,
    connectionPointId: null,
    assets,
});

const systemWith = (pointsOfAttack: PointOfAttack[]): SystemData => ({
    connections: [],
    components: [],
    pointsOfAttack,
    connectionPoints: [],
    lastAutoSaveDate: new Date().toISOString(),
});

const saveSystem = (pointsOfAttack: PointOfAttack[]) => updateSystem(projectId, { data: systemWith(pointsOfAttack) });

describe("updateSystem generic threat/threat generation", () => {
    it("creates a generic threat with no threats when a point of attack is exposed without assets", async () => {
        const pointOfAttackId = nanoid();
        await saveSystem([makePointOfAttack(pointOfAttackId, [])]);

        const generics = await getGenericThreatsByProjectId(projectId);
        expect(generics).toHaveLength(1);
        expect(generics[0]!.pointOfAttackId).toBe(pointOfAttackId);

        const generatedThreats = await getThreatsByGenericThreatId(generics[0]!.id);
        expect(generatedThreats).toEqual([]);
    });

    it("creates the first threat, inheriting generic threat identity, when the point of attack gains assets", async () => {
        const pointOfAttackId = nanoid();
        await saveSystem([makePointOfAttack(pointOfAttackId, [])]);
        await saveSystem([makePointOfAttack(pointOfAttackId, [1])]);

        const generics = await getGenericThreatsByProjectId(projectId);
        expect(generics).toHaveLength(1);

        const generatedThreats = await getThreatsByGenericThreatId(generics[0]!.id);
        expect(generatedThreats).toHaveLength(1);
        expect(generatedThreats[0]!.pointOfAttackId).toBe(pointOfAttackId);
        expect(generatedThreats[0]!.name).toBe(generics[0]!.name);
        expect(generatedThreats[0]!.attacker).toBe(generics[0]!.attacker);
    });

    it("does not duplicate threats when the system is saved again with the same assets", async () => {
        const pointOfAttackId = nanoid();
        await saveSystem([makePointOfAttack(pointOfAttackId, [])]);
        await saveSystem([makePointOfAttack(pointOfAttackId, [1])]);
        await saveSystem([makePointOfAttack(pointOfAttackId, [1])]);

        const generics = await getGenericThreatsByProjectId(projectId);
        const generatedThreats = await getThreatsByGenericThreatId(generics[0]!.id);
        expect(generatedThreats).toHaveLength(1);
    });

    it("regenerates a threat when a point of attack keeps its assets but has lost all threats", async () => {
        const pointOfAttackId = nanoid();
        await saveSystem([makePointOfAttack(pointOfAttackId, [])]);
        await saveSystem([makePointOfAttack(pointOfAttackId, [1])]);

        // Simulate a point of attack that still has assets but ended up with zero threats.
        await db.delete(threats).where(eq(threats.projectId, projectId));

        await saveSystem([makePointOfAttack(pointOfAttackId, [1])]);

        const generics = await getGenericThreatsByProjectId(projectId);
        const generatedThreats = await getThreatsByGenericThreatId(generics[0]!.id);
        expect(generatedThreats).toHaveLength(1);
    });

    it("deletes generic threats and threats when the point of attack is removed", async () => {
        const pointOfAttackId = nanoid();
        await saveSystem([makePointOfAttack(pointOfAttackId, [1])]);
        expect(await getGenericThreatsByProjectId(projectId)).toHaveLength(1);

        await saveSystem([]);

        expect(await getGenericThreatsByProjectId(projectId)).toEqual([]);
        const remainingThreats = await db.query.threats.findMany({
            where: eq(threats.projectId, projectId),
        });
        expect(remainingThreats).toEqual([]);
    });

    it("omits threats from the extended-threats query when their point of attack has lost all assets", async () => {
        const asset = (
            await db
                .insert(assets)
                .values({
                    name: "Asset",
                    description: "d",
                    confidentiality: 3,
                    integrity: 3,
                    availability: 3,
                    confidentialityJustification: "j",
                    integrityJustification: "j",
                    availabilityJustification: "j",
                    projectId,
                })
                .returning()
        ).at(0)!;

        const pointOfAttackId = nanoid();
        await saveSystem([makePointOfAttack(pointOfAttackId, [asset.id])]);

        // With an asset assigned, the generated threat surfaces in the threats-table query.
        const withAssets = await getGenericThreatsWithExtendedThreats(projectId);
        expect(withAssets).toHaveLength(1);
        expect(withAssets[0]!.threats).toHaveLength(1);

        // Removing every asset from a kept point of attack leaves the threat in the
        // database, but its risk is 0, so the query must not list it.
        await saveSystem([makePointOfAttack(pointOfAttackId, [])]);

        expect(await getGenericThreatsWithExtendedThreats(projectId)).toEqual([]);

        const generics = await getGenericThreatsByProjectId(projectId);
        expect(await getThreatsByGenericThreatId(generics[0]!.id)).toHaveLength(1);
    });
});

const insertCatalogThreat = async (targetCatalogId: number, overrides: Partial<typeof CATALOG_THREAT>) =>
    (
        await db
            .insert(catalogThreats)
            .values({ ...CATALOG_THREAT, ...overrides, catalogId: targetCatalogId })
            .returning()
    ).at(0)!;

describe("updateSystem threat creation for points of attack with assets", () => {
    it("creates one threat per generic threat across several points of attack, with their catalog threat's defaults", async () => {
        await insertCatalogThreat(catalogId, {
            name: "Catalog Threat 2",
            probability: 4,
            confidentiality: false,
            integrity: true,
            availability: false,
        });
        const firstPointOfAttackId = nanoid();
        const secondPointOfAttackId = nanoid();
        await saveSystem([makePointOfAttack(firstPointOfAttackId, []), makePointOfAttack(secondPointOfAttackId, [])]);

        await saveSystem([makePointOfAttack(firstPointOfAttackId, [1]), makePointOfAttack(secondPointOfAttackId, [1])]);

        const generics = await getGenericThreatsByProjectId(projectId);
        expect(generics).toHaveLength(4);
        const createdThreats = await db.select().from(threats).where(eq(threats.projectId, projectId));
        expect(createdThreats).toHaveLength(4);
        expect(createdThreats.map((threat) => threat.genericThreatId).sort()).toEqual(
            generics.map((genericThreat) => genericThreat.id).sort()
        );
        for (const threat of createdThreats) {
            const expected =
                threat.name === "Catalog Threat 2"
                    ? { probability: 4, confidentiality: false, integrity: true, availability: false }
                    : { probability: 2, confidentiality: true, integrity: false, availability: true };
            expect(threat).toMatchObject({ ...expected, status: "new", description: "" });
        }
    });

    it("uses a generic threat's catalog threat even when it is not in the project's catalog", async () => {
        const pointOfAttackId = nanoid();
        await saveSystem([makePointOfAttack(pointOfAttackId, [])]);
        const otherCatalog = (
            await db.insert(catalogs).values({ name: "Other catalog", language: LANGUAGES.EN }).returning()
        ).at(0)!;
        const otherCatalogThreat = await insertCatalogThreat(otherCatalog.id, { probability: 5, integrity: true });
        await db
            .update(genericThreats)
            .set({ catalogThreatId: otherCatalogThreat.id })
            .where(eq(genericThreats.projectId, projectId));

        await saveSystem([makePointOfAttack(pointOfAttackId, [1])]);

        const createdThreats = await db.select().from(threats).where(eq(threats.projectId, projectId));
        expect(createdThreats).toHaveLength(1);
        expect(createdThreats[0]).toMatchObject({ probability: 5, integrity: true });
    });
});
