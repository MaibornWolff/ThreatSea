/**
 * Round-trip fidelity tests for import/export: they assert the actual data survives, not just the
 * HTTP status. import.test.ts/export.test.ts only check status codes, so parent/child threats and
 * measure-impact links going through import were previously unverified.
 */
import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "#server.js";
import { db } from "#db/index.js";
import { threats, genericThreats, projects } from "#db/schema.js";
import { getGenericThreatsWithExtendedChildren } from "#services/generic-threats.service.js";
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
const normalizeGeneric = (g: ThreatRow) => ({
    name: g.name,
    description: g.description,
    attacker: g.attacker,
    pointOfAttack: g.pointOfAttack,
    pointOfAttackId: g.pointOfAttackId,
});

const normalizeChild = (c: ThreatRow) => ({
    name: c.name,
    description: c.description,
    status: c.status,
    confidentiality: c.confidentiality,
    integrity: c.integrity,
    availability: c.availability,
    probability: c.probability,
    attacker: c.attacker,
    pointOfAttack: c.pointOfAttack,
    pointOfAttackId: c.pointOfAttackId,
});

// A measure impact keyed by the *names* it links rather than the remapped ids, so the same link is
// comparable across two imports.
const resolveImpactLinks = (exp: ExportBody) => {
    const childById = new Map(exp.threats.map((c) => [c.id, c]));
    const measureById = new Map(exp.measures.map((m) => [m.id, m]));
    return exp.measureImpacts
        .map((mi) => ({
            childName: childById.get(mi.threatId)?.name,
            measureName: measureById.get(mi.measureId)?.name,
            probability: mi.probability,
            damage: mi.damage,
            impactsProbability: mi.impactsProbability,
            impactsDamage: mi.impactsDamage,
            setsOutOfScope: mi.setsOutOfScope,
        }))
        .sort((a, b) => `${a.childName}${a.measureName}`.localeCompare(`${b.childName}${b.measureName}`));
};

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

describe("import/export round-trip fidelity", () => {
    const SOURCE_NAME = "roundtrip-source";
    const COPY_NAME = "roundtrip-copy";

    it("import persists parent/child threats and their measure-impact links", async () => {
        const body = structuredClone(VALID_TEST_PROJECT) as unknown as ExportBody;
        body.project.name = SOURCE_NAME;
        await importProject(body);

        const exp = await exportByName(SOURCE_NAME);

        // Parent + child actually landed.
        expect(exp.genericThreats).toHaveLength(VALID_TEST_PROJECT.genericThreats.length);
        expect(exp.threats).toHaveLength(VALID_TEST_PROJECT.threats.length);

        const child = exp.threats[0]!;
        expect(child.name).toBe("Test");
        expect(child.status).toBe("new");
        expect(child.confidentiality).toBe(true);
        expect(child.integrity).toBe(false);
        expect(child.availability).toBe(false);
        expect(child.probability).toBe(1);

        // Child hangs off a parent that exists in the same project.
        expect(exp.genericThreats.some((g) => g.id === child.genericThreatId)).toBe(true);

        // The measure impact still connects the imported child and measure after id remapping.
        expect(exp.measureImpacts).toHaveLength(1);
        const impact = exp.measureImpacts[0]!;
        expect(exp.threats.some((c) => c.id === impact.threatId)).toBe(true);
        expect(exp.measures.some((m) => m.id === impact.measureId)).toBe(true);
        expect(impact.impactsProbability).toBe(true);
        expect(impact.impactsDamage).toBe(true);
        expect(impact.setsOutOfScope).toBe(false);
    });

    it("imports every child threat when a generic threat has multiple children", async () => {
        const NAME = "multichild-source";
        const body = structuredClone(VALID_TEST_PROJECT) as unknown as ExportBody;
        body.project.name = NAME;
        const second = structuredClone(body.threats[0]!);
        second.id = 987654;
        second.name = "Second Child";
        body.threats.push(second);

        await importProject(body);

        const project = await db.query.projects.findFirst({ where: eq(projects.name, NAME) });
        expect(project).toBeTruthy();

        // Ground truth: both children are actually in the DB, under a single generic threat.
        const dbChildren = await db.query.threats.findMany({
            where: eq(threats.projectId, project!.id),
        });
        const dbGenerics = await db.query.genericThreats.findMany({
            where: eq(genericThreats.projectId, project!.id),
        });
        expect(dbGenerics).toHaveLength(1);
        expect(dbChildren).toHaveLength(2);
        expect(new Set(dbChildren.map((c) => c.genericThreatId))).toEqual(new Set([dbGenerics[0]!.id]));

        // Export reflects both children too.
        const exp = await exportByName(NAME);
        expect(exp.threats).toHaveLength(2);

        // The display path (threats page + report both consume this) returns both children.
        const grouped = await getGenericThreatsWithExtendedChildren(project!.id);
        expect(grouped).toHaveLength(1);
        expect(grouped[0]!.children).toHaveLength(2);

        // And the HTTP endpoint the threats page actually calls returns both children.
        const endpointRes = await request(app)
            .get(`/api/projects/${project!.id}/system/genericThreats`)
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(endpointRes.statusCode).toEqual(200);
        expect(endpointRes.body).toHaveLength(1);
        expect(endpointRes.body[0].children).toHaveLength(2);
    });

    it("export -> import -> export preserves threats and measure-impact links", async () => {
        const first = await exportByName(SOURCE_NAME);

        const reimport = structuredClone(first);
        reimport.project.name = COPY_NAME;
        await importProject(reimport);

        const second = await exportByName(COPY_NAME);

        expect(second.genericThreats.map(normalizeGeneric).sort(byName)).toEqual(
            first.genericThreats.map(normalizeGeneric).sort(byName)
        );
        expect(second.threats.map(normalizeChild).sort(byName)).toEqual(first.threats.map(normalizeChild).sort(byName));
        expect(resolveImpactLinks(second)).toEqual(resolveImpactLinks(first));
    });
});

describe("import upgrades legacy exports", () => {
    it("imports a v3 flat-threat export by rebuilding generic + child threats", async () => {
        const NAME = "legacy-v3-source";

        // Down-convert the current fixture to the old flat shape the shim must accept: a single
        // `threats` array carrying catalogThreatId + doneEditing, and no `genericThreats`.
        const genericById = new Map(VALID_TEST_PROJECT.genericThreats.map((g) => [g.id, g]));
        const flatThreats = VALID_TEST_PROJECT.threats.map((t) => ({
            id: t.id,
            pointOfAttackId: t.pointOfAttackId,
            name: t.name,
            description: t.description,
            pointOfAttack: t.pointOfAttack,
            attacker: t.attacker,
            probability: t.probability,
            confidentiality: t.confidentiality,
            integrity: t.integrity,
            availability: t.availability,
            doneEditing: t.status === "finalized",
            catalogThreatId: genericById.get(t.genericThreatId)!.catalogThreatId,
            projectId: t.projectId,
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

        const dbGenerics = await db.query.genericThreats.findMany({
            where: eq(genericThreats.projectId, project!.id),
        });
        const dbChildren = await db.query.threats.findMany({ where: eq(threats.projectId, project!.id) });
        // One generic per (catalogThreatId, pointOfAttackId); one child per flat threat.
        expect(dbGenerics).toHaveLength(VALID_TEST_PROJECT.genericThreats.length);
        expect(dbChildren).toHaveLength(VALID_TEST_PROJECT.threats.length);
        expect(new Set(dbChildren.map((c) => c.genericThreatId))).toEqual(new Set(dbGenerics.map((g) => g.id)));

        const exp = await exportByName(NAME);
        const child = exp.threats[0]!;
        expect(child.name).toBe("Test");
        expect(child.status).toBe("new"); // derived from doneEditing = false
        expect(exp.genericThreats.some((g) => g.id === child.genericThreatId)).toBe(true);
        // The measure impact still links through the flat -> child id mapping.
        expect(exp.measureImpacts).toHaveLength(1);
        expect(exp.threats.some((c) => c.id === exp.measureImpacts[0]!.threatId)).toBe(true);
    });
});
