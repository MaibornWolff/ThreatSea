/**
 * Tests for the updateSystem parent/child threat generation flow (the core of #396):
 * exposing a point of attack creates immutable parent (generic) threats; assigning assets creates
 * the first child; re-saving does not duplicate children; a point of attack that has assets but no
 * children gets one regenerated; and removing a point of attack cascades its threats away.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { nanoid } from "nanoid";
import { db } from "#db/index.js";
import { catalogs, threats, usersCatalogs } from "#db/schema.js";
import { app } from "#server.js";
import { eq } from "drizzle-orm";
import { LANGUAGES } from "#types/languages.type.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import { POINTS_OF_ATTACK } from "#types/points-of-attack.types.js";
import { ATTACKERS } from "#types/attackers.types.js";
import { CONFIDENTIALITY_LEVELS } from "#types/confidentiality-levels.types.js";
import type { PointOfAttack, SystemData } from "#types/system.types.js";
import { updateSystem } from "#services/updateSystem.service.js";
import { getGenericThreatsByProjectId } from "#services/generic-threats.service.js";
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
// catalog threat matching POA_TYPE, so threat generation is deterministic (one parent per exposed
// point of attack).
beforeEach(async () => {
    const catalog = (await db.insert(catalogs).values({ name: "Catalog", language: LANGUAGES.EN }).returning()).at(0)!;

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

const makePoA = (id: string, assets: number[]): PointOfAttack => ({
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

describe("updateSystem parent/child threat generation", () => {
    it("creates a parent threat with no children when a point of attack is exposed without assets", async () => {
        const poaId = nanoid();
        await saveSystem([makePoA(poaId, [])]);

        const generics = await getGenericThreatsByProjectId(projectId);
        expect(generics).toHaveLength(1);
        expect(generics[0]!.pointOfAttackId).toBe(poaId);

        const children = await getThreatsByGenericThreatId(generics[0]!.id);
        expect(children).toEqual([]);
    });

    it("creates the first child threat, inheriting parent identity, when the point of attack gains assets", async () => {
        const poaId = nanoid();
        await saveSystem([makePoA(poaId, [])]);
        await saveSystem([makePoA(poaId, [1])]);

        const generics = await getGenericThreatsByProjectId(projectId);
        expect(generics).toHaveLength(1);

        const children = await getThreatsByGenericThreatId(generics[0]!.id);
        expect(children).toHaveLength(1);
        expect(children[0]!.pointOfAttackId).toBe(poaId);
        expect(children[0]!.name).toBe(generics[0]!.name);
        expect(children[0]!.attacker).toBe(generics[0]!.attacker);
    });

    it("does not duplicate children when the system is saved again with the same assets", async () => {
        const poaId = nanoid();
        await saveSystem([makePoA(poaId, [])]);
        await saveSystem([makePoA(poaId, [1])]);
        await saveSystem([makePoA(poaId, [1])]);

        const generics = await getGenericThreatsByProjectId(projectId);
        const children = await getThreatsByGenericThreatId(generics[0]!.id);
        expect(children).toHaveLength(1);
    });

    it("regenerates a child when a point of attack keeps its assets but has lost all children", async () => {
        const poaId = nanoid();
        await saveSystem([makePoA(poaId, [])]);
        await saveSystem([makePoA(poaId, [1])]);

        // Simulate a point of attack that still has assets but ended up with zero children.
        await db.delete(threats).where(eq(threats.projectId, projectId));

        await saveSystem([makePoA(poaId, [1])]);

        const generics = await getGenericThreatsByProjectId(projectId);
        const children = await getThreatsByGenericThreatId(generics[0]!.id);
        expect(children).toHaveLength(1);
    });

    it("deletes parent and child threats when the point of attack is removed", async () => {
        const poaId = nanoid();
        await saveSystem([makePoA(poaId, [1])]);
        expect(await getGenericThreatsByProjectId(projectId)).toHaveLength(1);

        await saveSystem([]);

        expect(await getGenericThreatsByProjectId(projectId)).toEqual([]);
        const remainingChildren = await db.query.threats.findMany({
            where: eq(threats.projectId, projectId),
        });
        expect(remainingChildren).toEqual([]);
    });
});
