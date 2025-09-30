/**
 * Module that defines the logic for thread
 * manipulation for the current project.
 */
import { eq } from "drizzle-orm";
import { db, TransactionType } from "#db/index.js";
import { Asset, CreateThreat, Threat, threats, UpdateThreat } from "#db/schema.js";
import { ComponentType } from "#types/system.types.js";
import { getPointsOfAttack } from "#services/points-of-attack.service.js";
import { deleteMeasureImpactsByThreat } from "#services/measureImpacts.service.js";
import { POINTS_OF_ATTACK } from "#types/points-of-attack.types.js";

export async function cleanUpUnusedImpacts(projectId: number) {
    const selectedThreats = await db.query.threats.findMany({ where: eq(threats.projectId, projectId) });

    // Gets the points of attack for this project.
    const pointsOfAttack = await getPointsOfAttack(projectId);

    selectedThreats
        .map((threat) => {
            // Get point of attack involved.
            const pointOfAttack = pointsOfAttack.find((pointOfAttack) => pointOfAttack.id === threat.pointOfAttackId);

            // Map threat data with assets together.
            return {
                ...threat,
                assets: pointOfAttack?.assets || [],
            };
        })
        .forEach((threat) => {
            if (threat.assets.length <= 0) {
                deleteMeasureImpactsByThreat(threat.id);
            }
        });
}

export type ExtendedThreat = Threat & {
    assets: Asset[];
    componentName: string | null;
    componentType: number | ComponentType | null;
    interfaceName: string | null;
};

/**
 * Gets all threats of the project with the components and assets involved.
 *
 * @param {number} projectId - id of the current project.
 * @returns {Promise<ExtendedThreat[]>} A promise that resolves to an array of threats with their components and assets.
 */
export async function getThreats(projectId: number): Promise<ExtendedThreat[]> {
    // Fetches all thread of the current project.
    const selectedThreats = await db.query.threats.findMany({ where: eq(threats.projectId, projectId) });

    // Gets the points of attack for this project.
    const pointsOfAttack = await getPointsOfAttack(projectId);

    return (
        selectedThreats
            .map((threat) => {
                // Get point of attack involved.
                const pointOfAttack = pointsOfAttack.find(
                    (pointOfAttack) => pointOfAttack.id === threat.pointOfAttackId
                );

                let interfaceName: string | null = null;
                if (pointOfAttack?.type === POINTS_OF_ATTACK.COMMUNICATION_INTERFACES) {
                    interfaceName = pointOfAttack.name ?? null;
                }

                // Map threat data with the component and assets together.
                return {
                    ...threat,
                    componentName: pointOfAttack?.componentName ?? null,
                    componentType: pointOfAttack?.componentType ?? null,
                    assets: pointOfAttack?.assets ?? [],
                    interfaceName,
                };
            })
            // Sort out threats with no assets involved. And deleting useless MeasureImpacts
            .filter((threat) => {
                if (threat.assets.length > 0) {
                    return true;
                } else {
                    deleteMeasureImpactsByThreat(threat.id);
                    return false;
                }
            })
    );
}

/**
 * Gets all threats of the project with the components and assets involved for export.
 *
 * @param {number} projectId - The id of the project.
 * @returns {Promise<ExtendedThreat>} A promise that resolves to an array of extended threats.
 */
export async function getThreatsForExport(projectId: number): Promise<ExtendedThreat[]> {
    // Fetches all thread of the current project.
    const selectedThreats = await db.query.threats.findMany({ where: eq(threats.projectId, projectId) });

    // Gets the points of attack for this project.
    const pointsOfAttack = await getPointsOfAttack(projectId);

    return selectedThreats.map((threat) => {
        // Get point of attack involved.
        const pointOfAttack = pointsOfAttack.find((pointOfAttack) => pointOfAttack.id === threat.pointOfAttackId);

        // Resolve the component.
        let actualComponentName: string | null = null;
        let actualComponentType: number | ComponentType | null = null;
        if (pointOfAttack) {
            const { type, componentType, componentName, connectionName, connectionPointName } = pointOfAttack;
            actualComponentName =
                type === "COMMUNICATION_INTERFACES"
                    ? connectionPointName
                    : type === "COMMUNICATION_INFRASTRUCTURE"
                      ? connectionName
                      : componentName
                        ? componentName
                        : "";
            actualComponentType = componentType;
        }

        let interfaceName: string | null = null;
        if (pointOfAttack?.type === POINTS_OF_ATTACK.COMMUNICATION_INTERFACES) {
            interfaceName = pointOfAttack.name ?? null;
        }
        // Map threat data with the component and assets together.
        return {
            ...threat,
            componentName: actualComponentName,
            componentType: actualComponentType,
            assets: pointOfAttack?.assets ?? [],
            interfaceName,
        };
    });
}

/**
 * Gets a specific threat by its id.
 *
 * @param {number} threatId - The id of the thread.
 * @returns
 */
export async function getThreat(threatId: number): Promise<Threat | null> {
    const threat = await db.query.threats.findFirst({ where: eq(threats.id, threatId) });

    return threat ?? null;
}

/**
 * Updates the threat with the specified id.
 *
 * @param threatId - The id of the threat.
 * @param {UpdateThreat} updateThreatData - The data of the threat.
 * @return {Promise<Threat>} A promise that resolves to the updated threat.
 * @throws {Error} If the threat could not be updated.
 */
export async function updateThreat(threatId: number, updateThreatData: UpdateThreat): Promise<Threat> {
    const [threat] = await db.update(threats).set(updateThreatData).where(eq(threats.id, threatId)).returning();

    if (!threat) {
        throw new Error("Failed to update threat");
    }

    return threat;
}

/**
 * Deletes the threat with the specified id.
 *
 * @param {number} threatId - The id of the threat.
 * @returns {Promise<void>} A promise that resolves when the threat is deleted.
 */
export async function deleteThreat(threatId: number): Promise<void> {
    await db.delete(threats).where(eq(threats.id, threatId));
}

/**
 * Creates a new thread.
 *
 * @param {CreateThreat} createThreatData - The data of the threat.
 * @param {TransactionType} transaction - drizzle transaction
 * @returns {Promise<Threat>} A promise that resolves to the created threat.
 * @throws {Error} If the threat could not be created.
 */
export async function createThreat(
    createThreatData: CreateThreat,
    transaction: TransactionType | undefined = undefined
): Promise<ExtendedThreat> {
    const [threat] = await (transaction ?? db).insert(threats).values(createThreatData).returning();

    if (!threat) {
        throw new Error("Failed to create threat");
    }

    const pointOfAttack = (await getPointsOfAttack(createThreatData.projectId)).find(
        (poa) => poa.id === threat?.pointOfAttackId
    );

    let interfaceName: string | null = null;
    if (pointOfAttack?.type === POINTS_OF_ATTACK.COMMUNICATION_INTERFACES) {
        interfaceName = pointOfAttack.name ?? null;
    }

    return {
        ...threat,
        componentName: pointOfAttack?.componentName ?? null,
        componentType: pointOfAttack?.componentType ?? null,
        assets: pointOfAttack?.assets ?? [],
        interfaceName,
    };
}
