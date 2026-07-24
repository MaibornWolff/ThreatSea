import { DATAMODEL_VERSION } from "#dataModelVersion.js";
import { THREAT_STATUSES } from "#types/threat-statuses.types.js";

/**
 * Data model version of the old flat-threat export format (pre parent/child rework).
 */
export const FLAT_THREAT_DATAMODEL_VERSION = 3;

/**
 * A threat as it appeared in a v3 (flat) export: one row per threat, carrying its own catalogue
 * reference and a `doneEditing` flag instead of the generic/child split and `status` enum.
 */
interface FlatThreat {
    id: number;
    pointOfAttackId: string;
    name: string;
    description: string;
    pointOfAttack: string;
    attacker: string;
    probability: number;
    confidentiality: boolean;
    integrity: boolean;
    availability: boolean;
    doneEditing: boolean;
    catalogThreatId: number;
    projectId: number;
}

interface ExportedCatalogThreat {
    id: number;
    name: string;
    description: string | null;
    pointOfAttack: string;
    attacker: string;
}

interface ImportedMeasureImpact {
    threatId: number;
    setsOutOfScope: boolean;
}

interface ImportBody {
    datamodelVersion?: number;
    threats?: unknown[];
    genericThreats?: unknown[];
    catalogThreats?: unknown[];
    measureImpacts?: unknown[];
    [key: string]: unknown;
}

/**
 * Upgrades an import body in place to the current data model version.
 *
 * A v3 export stores a single flat `threats` array. This mirrors the `0005` database migration to
 * split each flat threat into a generic (parent) threat plus a child threat:
 *   - generic threats are grouped by (catalogThreatId, projectId, pointOfAttackId); their
 *     name/description/pointOfAttack/attacker come from the referenced catalogue threat,
 *   - each flat threat becomes a child threat keeping its own fields, its id (so measure impacts keep
 *     resolving), `status` set to "finalized" only when it was done editing and either impacts a
 *     protection goal or has a measure that sets it out of scope (otherwise "new"), and a
 *     `genericThreatId` pointing at its parent.
 *
 * Bodies already at the current version (or any unknown version) are left untouched; the caller still
 * validates `datamodelVersion` afterwards.
 */
export function upgradeImportBodyToCurrent(body: ImportBody): void {
    if (body.datamodelVersion !== FLAT_THREAT_DATAMODEL_VERSION) {
        return;
    }

    const flatThreats = (body.threats ?? []) as FlatThreat[];
    const catalogThreats = (body.catalogThreats ?? []) as ExportedCatalogThreat[];
    const catalogThreatById = new Map(catalogThreats.map((catalogThreat) => [catalogThreat.id, catalogThreat]));

    const measureImpacts = (body.measureImpacts ?? []) as ImportedMeasureImpact[];
    const outOfScopeThreatIds = new Set(
        measureImpacts
            .filter((measureImpact) => measureImpact.setsOutOfScope)
            .map((measureImpact) => measureImpact.threatId)
    );

    const genericThreats: Record<string, unknown>[] = [];
    const genericIdByGroup = new Map<string, number>();
    let nextGenericThreatId = 1;

    const threats = flatThreats.map((flatThreat) => {
        const groupKey = `${flatThreat.catalogThreatId}|${flatThreat.pointOfAttackId}`;
        let genericThreatId = genericIdByGroup.get(groupKey);

        if (genericThreatId === undefined) {
            genericThreatId = nextGenericThreatId++;
            genericIdByGroup.set(groupKey, genericThreatId);

            const catalogThreat = catalogThreatById.get(flatThreat.catalogThreatId);
            genericThreats.push({
                id: genericThreatId,
                pointOfAttackId: flatThreat.pointOfAttackId,
                name: catalogThreat?.name ?? flatThreat.name,
                description: catalogThreat?.description ?? "",
                pointOfAttack: catalogThreat?.pointOfAttack ?? flatThreat.pointOfAttack,
                attacker: catalogThreat?.attacker ?? flatThreat.attacker,
                catalogThreatId: flatThreat.catalogThreatId,
                projectId: flatThreat.projectId,
            });
        }

        return {
            id: flatThreat.id,
            pointOfAttackId: flatThreat.pointOfAttackId,
            name: flatThreat.name,
            description: flatThreat.description ?? "",
            pointOfAttack: flatThreat.pointOfAttack,
            attacker: flatThreat.attacker,
            probability: flatThreat.probability,
            confidentiality: flatThreat.confidentiality,
            integrity: flatThreat.integrity,
            availability: flatThreat.availability,
            status:
                flatThreat.doneEditing &&
                (flatThreat.confidentiality ||
                    flatThreat.integrity ||
                    flatThreat.availability ||
                    outOfScopeThreatIds.has(flatThreat.id))
                    ? THREAT_STATUSES.FINALIZED
                    : THREAT_STATUSES.NEW,
            genericThreatId,
            projectId: flatThreat.projectId,
        };
    });

    body.genericThreats = genericThreats;
    body.threats = threats;
    body.datamodelVersion = DATAMODEL_VERSION;
}
