/**
 * Module that defines access to the points of attack.
 */
import { Asset } from "#db/schema.js";
import { ComponentType } from "#types/system.types.js";
import { findSystem } from "#services/system.service.js";
import { getMultipleAssets } from "#services/assets.service.js";

export interface PointOfAttack {
    id: string;
    name: string | null;
    assets: Asset[];
    type: string;
    componentId: string | null;
    connectionId: string | null;
    connectionPointId: string | null;
    componentName: string | null;
    componentType: number | ComponentType | null;
    connectionName: string | null;
    connectionPointName: string | null;
}

/**
 * Gets the assets involved in the point of attack.
 *
 * @param {number[]} assetIds - object that defines a point
 *     of attack.
 * @returns An array of objects with the asset data.
 */
async function getAssets(assetIds: number[]): Promise<Asset[]> {
    if (assetIds.length === 0) return [];

    return await getMultipleAssets(assetIds);
}

/**
 * Fetches every point of attack of the system and resolves
 * the components and assets involved with them.
 *
 * @param {number} projectId - The current project id.
 * @returns Array of the resolved components that can be attacked.
 */
export async function getPointsOfAttack(projectId: number): Promise<PointOfAttack[]> {
    // Fetch system.
    const system = await findSystem(projectId);
    if (!system) return [];
    const { data } = system;
    if (!data) return [];

    // Destructure data.
    const { pointsOfAttack, components = [], connections = [], connectionPoints = [] } = data;

    const items: PointOfAttack[] = [];
    for (const pointOfAttack of pointsOfAttack) {
        const component = components.find((component) => component.id === pointOfAttack?.componentId);
        const connection = connections.find((connection) => connection.id === pointOfAttack?.connectionId);

        const connectionPoint = connectionPoints.find(
            (connectionPoint) => connectionPoint.id === pointOfAttack?.connectionPointId
        );

        // optional chaining if the member does not exist.
        const componentName = component?.name ?? null;
        const componentType = component?.type ?? null;
        const connectionId = connection?.id ?? null;
        const connectionName = connection?.name ?? null;

        const connectionPointId = connectionPoint?.id ?? null;
        const connectionPointName = connectionPoint?.name ?? null;

        const assets = await getAssets(pointOfAttack.assets);

        items.push({
            ...pointOfAttack,
            assets,
            componentName,
            componentType,
            connectionId,
            connectionName,
            connectionPointId,
            connectionPointName,
        });
    }

    return items;
}
