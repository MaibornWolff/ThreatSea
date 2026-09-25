/**
 * Round-trip fidelity tests for import/export: they assert the actual data survives, not just the
 * HTTP status. import.test.ts/export.test.ts only check status codes, so generic threats, threats and
 * measure-impact links going through import were previously unverified.
 */
import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "#server.js";
import { db } from "#db/index.js";
import { threats, genericThreats, projects } from "#db/schema.js";
import { getGenericThreatsWithExtendedThreats } from "#services/generic-threats.service.js";
import { eq } from "drizzle-orm";
import VALID_TEST_PROJECT from "./testData/testData.json" with { type: "json" };

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

interface ThreatRow {
    id: number;
    genericThreatId?: number;
    name: string;
    description: string;
    status?: string;
    confidentiality?: boolean;
    integrity?: boolean;
    availability?: boolean;
    probability?: number;
    attacker: string;
    pointOfAttack: string;
    pointOfAttackId: string;
}
interface MeasureRow {
    id: number;
    name: string;
}
interface MeasureImpactRow {
    id: number;
    threatId: number;
    measureId: number;
    probability: number;
    damage: number;
    impactsProbability: boolean;
    impactsDamage: boolean;
    setsOutOfScope: boolean;
}
// Only the fields the tests read; the runtime object carries the full export (structuredClone keeps
// everything, so re-import still gets a complete body).
interface ExportBody {
    project: { name: string };
    genericThreats: ThreatRow[];
    threats: ThreatRow[];
    measures: MeasureRow[];
    measureImpacts: MeasureImpactRow[];
}

async function importProject(body: ExportBody): Promise<void> {
    const res = await request(app).post("/api/import").send(body).set("X-CSRF-TOKEN", csrfToken).set("Cookie", cookies);
    expect(res.statusCode).toEqual(204);
}

async function exportByName(name: string): Promise<ExportBody> {
    const project = await db.query.projects.findFirst({ where: eq(projects.name, name) });
    expect(project, `imported project "${name}" should exist`).toBeTruthy();
    const res = await request(app)
        .get("/api/export/" + project!.id)
        .set("X-CSRF-TOKEN", csrfToken)
        .set("Cookie", cookies);
    expect(res.statusCode).toEqual(200);
    return res.body as ExportBody;
}

// Identity of a threat, stripped of the fields that legitimately change across import (surrogate
// ids, remapped foreign keys, timestamps).
const normalizeGenericThreat = (genericThreat: ThreatRow) => ({
    name: genericThreat.name,
    description: genericThreat.description,
    attacker: genericThreat.attacker,
    pointOfAttack: genericThreat.pointOfAttack,
    pointOfAttackId: genericThreat.pointOfAttackId,
});

const normalizeThreat = (threat: ThreatRow) => ({
    name: threat.name,
    description: threat.description,
    status: threat.status,
    confidentiality: threat.confidentiality,
    integrity: threat.integrity,
    availability: threat.availability,
    probability: threat.probability,
    attacker: threat.attacker,
    pointOfAttack: threat.pointOfAttack,
    pointOfAttackId: threat.pointOfAttackId,
});

// A measure impact keyed by the *names* it links rather than the remapped ids, so the same link is
// comparable across two imports.
const resolveImpactLinks = (exported: ExportBody) => {
    const threatById = new Map(exported.threats.map((threat) => [threat.id, threat]));
    const measureById = new Map(exported.measures.map((measure) => [measure.id, measure]));
    return exported.measureImpacts
        .map((measureImpact) => ({
            threatName: threatById.get(measureImpact.threatId)?.name,
            measureName: measureById.get(measureImpact.measureId)?.name,
            probability: measureImpact.probability,
            damage: measureImpact.damage,
            impactsProbability: measureImpact.impactsProbability,
            impactsDamage: measureImpact.impactsDamage,
            setsOutOfScope: measureImpact.setsOutOfScope,
        }))
        .sort((a, b) => `${a.threatName}${a.measureName}`.localeCompare(`${b.threatName}${b.measureName}`));
};

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

describe("import/export round-trip fidelity", () => {
    const SOURCE_NAME = "roundtrip-source";
    const COPY_NAME = "roundtrip-copy";

    it("import persists generic threats, threats and their measure-impact links", async () => {
        const body = structuredClone(VALID_TEST_PROJECT) as unknown as ExportBody;
        body.project.name = SOURCE_NAME;
        await importProject(body);

        const exported = await exportByName(SOURCE_NAME);

        // Generic threat + threat actually landed.
        expect(exported.genericThreats).toHaveLength(VALID_TEST_PROJECT.genericThreats.length);
        expect(exported.threats).toHaveLength(VALID_TEST_PROJECT.threats.length);

        const threat = exported.threats[0]!;
        expect(threat.name).toBe("Test");
        expect(threat.status).toBe("new");
        expect(threat.confidentiality).toBe(true);
        expect(threat.integrity).toBe(false);
        expect(threat.availability).toBe(false);
        expect(threat.probability).toBe(1);

        // Threat hangs off a generic threat that exists in the same project.
        expect(exported.genericThreats.some((genericThreat) => genericThreat.id === threat.genericThreatId)).toBe(true);

        // The measure impact still connects the imported threat and measure after id remapping.
        expect(exported.measureImpacts).toHaveLength(1);
        const impact = exported.measureImpacts[0]!;
        expect(exported.threats.some((exportedThreat) => exportedThreat.id === impact.threatId)).toBe(true);
        expect(exported.measures.some((measure) => measure.id === impact.measureId)).toBe(true);
        expect(impact.impactsProbability).toBe(true);
        expect(impact.impactsDamage).toBe(true);
        expect(impact.setsOutOfScope).toBe(false);
    });

    it("imports every threat when a generic threat has multiple threats", async () => {
        const NAME = "multi-threat-source";
        const body = structuredClone(VALID_TEST_PROJECT) as unknown as ExportBody;
        body.project.name = NAME;
        const second = structuredClone(body.threats[0]!);
        second.id = 987654;
        second.name = "Second Threat";
        body.threats.push(second);

        await importProject(body);

        const project = await db.query.projects.findFirst({ where: eq(projects.name, NAME) });
        expect(project).toBeTruthy();

        // Ground truth: both threats are actually in the DB, under a single generic threat.
        const dbThreats = await db.query.threats.findMany({
            where: eq(threats.projectId, project!.id),
        });
        const dbGenericThreats = await db.query.genericThreats.findMany({
            where: eq(genericThreats.projectId, project!.id),
        });
        expect(dbGenericThreats).toHaveLength(1);
        expect(dbThreats).toHaveLength(2);
        expect(new Set(dbThreats.map((threat) => threat.genericThreatId))).toEqual(new Set([dbGenericThreats[0]!.id]));

        // Export reflects both threats too.
        const exported = await exportByName(NAME);
        expect(exported.threats).toHaveLength(2);

        // The display path (threats page + report both consume this) returns both threats.
        const grouped = await getGenericThreatsWithExtendedThreats(project!.id);
        expect(grouped).toHaveLength(1);
        expect(grouped[0]!.threats).toHaveLength(2);

        // And the HTTP endpoint the threats page actually calls returns both threats.
        const endpointRes = await request(app)
            .get(`/api/projects/${project!.id}/system/threats/generic`)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(endpointRes.statusCode).toEqual(200);
        expect(endpointRes.body).toHaveLength(1);
        expect(endpointRes.body[0].threats).toHaveLength(2);
    });

    it("export -> import -> export preserves threats and measure-impact links", async () => {
        const first = await exportByName(SOURCE_NAME);

        const reimport = structuredClone(first);
        reimport.project.name = COPY_NAME;
        await importProject(reimport);

        const second = await exportByName(COPY_NAME);

        expect(second.genericThreats.map(normalizeGenericThreat).sort(byName)).toEqual(
            first.genericThreats.map(normalizeGenericThreat).sort(byName)
        );
        expect(second.threats.map(normalizeThreat).sort(byName)).toEqual(
            first.threats.map(normalizeThreat).sort(byName)
        );
        expect(resolveImpactLinks(second)).toEqual(resolveImpactLinks(first));
    });
});

describe("import upgrades legacy exports", () => {
    it("imports a v3 flat-threat export by rebuilding generic threats + threats", async () => {
        const NAME = "legacy-v3-source";

        // Down-convert the current fixture to the old flat shape the shim must accept: a single
        // `threats` array carrying catalogThreatId + doneEditing, and no `genericThreats`.
        const genericThreatById = new Map(
            VALID_TEST_PROJECT.genericThreats.map((genericThreat) => [genericThreat.id, genericThreat])
        );
        const flatThreats = VALID_TEST_PROJECT.threats.map((threat) => ({
            id: threat.id,
            pointOfAttackId: threat.pointOfAttackId,
            name: threat.name,
            description: threat.description,
            pointOfAttack: threat.pointOfAttack,
            attacker: threat.attacker,
            probability: threat.probability,
            confidentiality: threat.confidentiality,
            integrity: threat.integrity,
            availability: threat.availability,
            doneEditing: threat.status === "finalized",
            catalogThreatId: genericThreatById.get(threat.genericThreatId)!.catalogThreatId,
            projectId: threat.projectId,
        }));

        const body = structuredClone(VALID_TEST_PROJECT) as unknown as {
            datamodelVersion: number;
            project: { name: string };
            threats: unknown;
            genericThreats?: unknown;
        };
        body.datamodelVersion = 3;
        body.threats = flatThreats;
        delete body.genericThreats;
        body.project.name = NAME;

        await importProject(body as unknown as ExportBody);

        const project = await db.query.projects.findFirst({ where: eq(projects.name, NAME) });
        expect(project).toBeTruthy();

        const dbGenericThreats = await db.query.genericThreats.findMany({
            where: eq(genericThreats.projectId, project!.id),
        });
        const dbThreats = await db.query.threats.findMany({ where: eq(threats.projectId, project!.id) });
        // One generic per (catalogThreatId, pointOfAttackId); one threat per flat threat.
        expect(dbGenericThreats).toHaveLength(VALID_TEST_PROJECT.genericThreats.length);
        expect(dbThreats).toHaveLength(VALID_TEST_PROJECT.threats.length);
        expect(new Set(dbThreats.map((threat) => threat.genericThreatId))).toEqual(
            new Set(dbGenericThreats.map((genericThreat) => genericThreat.id))
        );

        const exported = await exportByName(NAME);
        const threat = exported.threats[0]!;
        expect(threat.name).toBe("Test");
        expect(threat.status).toBe("new"); // derived from doneEditing = false
        expect(exported.genericThreats.some((genericThreat) => genericThreat.id === threat.genericThreatId)).toBe(true);
        // The measure impact still links through the flat -> threat id mapping.
        expect(exported.measureImpacts).toHaveLength(1);
        expect(
            exported.threats.some((exportedThreat) => exportedThreat.id === exported.measureImpacts[0]!.threatId)
        ).toBe(true);
    });
});
