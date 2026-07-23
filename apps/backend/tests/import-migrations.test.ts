/**
 * Unit tests for the v3 (flat threats) -> current data model upgrade applied on import. The transform
 * mirrors the 0005 database migration, so these assert the same split: catalogue-derived generic
 * threats + flat-derived child threats.
 */
import { describe, expect, it } from "vitest";
import { FLAT_THREAT_DATAMODEL_VERSION, upgradeImportBodyToCurrent } from "#controllers/import-migrations.js";
import { DATAMODEL_VERSION } from "#dataModelVersion.js";

const flatThreat = (over: Record<string, unknown>) => ({
    id: 0,
    pointOfAttackId: "poa-instance",
    name: "Flat",
    description: "flat desc",
    pointOfAttack: "DATA_STORAGE_INFRASTRUCTURE",
    attacker: "SYSTEM_USERS",
    probability: 1,
    confidentiality: true,
    integrity: false,
    availability: false,
    doneEditing: false,
    catalogThreatId: 10,
    projectId: 5,
    ...over,
});

describe("upgradeImportBodyToCurrent", () => {
    it("splits a v3 flat export into deduped generic + child threats (mirrors 0005)", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body: any = {
            datamodelVersion: FLAT_THREAT_DATAMODEL_VERSION,
            catalogThreats: [
                {
                    id: 10,
                    name: "Catalogue name",
                    description: "Catalogue desc",
                    pointOfAttack: "DATA_STORAGE_INFRASTRUCTURE",
                    attacker: "SYSTEM_USERS",
                },
            ],
            threats: [
                flatThreat({ id: 1, pointOfAttackId: "poa-a", name: "Refined A", doneEditing: true, probability: 3 }),
                flatThreat({ id: 2, pointOfAttackId: "poa-a", name: "Refined B" }),
                flatThreat({ id: 3, pointOfAttackId: "poa-b", name: "Refined C" }),
            ],
            measureImpacts: [{ id: 1, threatId: 2, measureId: 1 }],
        };

        upgradeImportBodyToCurrent(body);

        expect(body.datamodelVersion).toBe(DATAMODEL_VERSION);

        // Two flat threats share (catalogThreatId, pointOfAttackId) -> one generic; the third -> another.
        expect(body.genericThreats).toHaveLength(2);
        // Generic identity comes from the catalogue threat, not the (refined) flat threat.
        const genericA = body.genericThreats.find((g: { pointOfAttackId: string }) => g.pointOfAttackId === "poa-a");
        expect(genericA.name).toBe("Catalogue name");
        expect(genericA.description).toBe("Catalogue desc");
        expect(genericA.catalogThreatId).toBe(10);
        expect(genericA).not.toHaveProperty("status");

        // One child per flat threat, ids preserved, generic linkage by group.
        expect(body.threats).toHaveLength(3);
        expect(body.threats.map((t: { id: number }) => t.id)).toEqual([1, 2, 3]);
        const [c1, c2, c3] = body.threats;
        expect(c1.genericThreatId).toBe(c2.genericThreatId);
        expect(c3.genericThreatId).not.toBe(c1.genericThreatId);
        // finalized only when done editing AND a protection goal is impacted; child keeps its own
        // (refined) name; drops catalog/doneEditing.
        expect(c1.status).toBe("finalized");
        expect(c2.status).toBe("new");
        expect(c1.name).toBe("Refined A");
        expect(c1).not.toHaveProperty("catalogThreatId");
        expect(c1).not.toHaveProperty("doneEditing");

        // Measure impacts are untouched (their threatId still points at the preserved child id).
        expect(body.measureImpacts).toEqual([{ id: 1, threatId: 2, measureId: 1 }]);
    });

    it("maps a done-editing threat with no impacted protection goal to new", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body: any = {
            datamodelVersion: FLAT_THREAT_DATAMODEL_VERSION,
            catalogThreats: [
                {
                    id: 10,
                    name: "Catalogue name",
                    description: "Catalogue desc",
                    pointOfAttack: "DATA_STORAGE_INFRASTRUCTURE",
                    attacker: "SYSTEM_USERS",
                },
            ],
            threats: [
                flatThreat({
                    id: 1,
                    doneEditing: true,
                    confidentiality: false,
                    integrity: false,
                    availability: false,
                }),
            ],
        };

        upgradeImportBodyToCurrent(body);

        expect(body.threats[0].status).toBe("new");
    });

    it("leaves a current-version body untouched", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body: any = {
            datamodelVersion: DATAMODEL_VERSION,
            genericThreats: [{ id: 1 }],
            threats: [{ id: 1, genericThreatId: 1, status: "new" }],
        };
        const snapshot = structuredClone(body);
        upgradeImportBodyToCurrent(body);
        expect(body).toEqual(snapshot);
    });
});
