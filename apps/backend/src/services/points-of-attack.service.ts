/**
 * Module that defines access to the points of attack.
 */
import { Asset } from "#db/schema.js";
import { ComponentType } from "#types/system.types.js";
import { findSystem } from "#services/system.service.js";
import { getAssets } from "#services/assets.service.js";

interface PointOfAttack {
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
 * Fetches every point of attack of the system and resolves
 * the components and assets involved with them.
 *
 * @param {number} projectId - The current project id.
 * @returns Array of the resolved components that can be attacked.
 */
export async function getPointsOfAttack(projectId: number): Promise<PointOfAttack[]> {
    // Fetch system.
    const system = await findSystem(projectId);
    if (!system) {
        return [];
    }
    const { data } = system;
    if (!data) {
        return [];
    }

    // Destructure data.
    const { pointsOfAttack, components = [], connections = [], connectionPoints = [] } = data;

    const componentsById = new Map(components.map((component) => [component.id, component]));
    const connectionsById = new Map(connections.map((connection) => [connection.id, connection]));
    const connectionPointsById = new Map(
        connectionPoints.map((connectionPoint) => [connectionPoint.id, connectionPoint])
    );
    const projectAssetsById = new Map((await getAssets(projectId)).map((asset) => [asset.id, asset]));

    const items: PointOfAttack[] = [];
    for (const pointOfAttack of pointsOfAttack) {
        const component = pointOfAttack?.componentId ? componentsById.get(pointOfAttack.componentId) : undefined;
        const connection = pointOfAttack?.connectionId ? connectionsById.get(pointOfAttack.connectionId) : undefined;
        const connectionPoint = pointOfAttack?.connectionPointId
            ? connectionPointsById.get(pointOfAttack.connectionPointId)
            : undefined;

        // optional chaining if the member does not exist.
        const componentName = component?.name ?? null;
        const componentType = component?.type ?? null;
        const connectionId = connection?.id ?? null;
        const connectionName = connection?.name ?? null;

        const connectionPointId = connectionPoint?.id ?? null;
        const connectionPointName = connectionPoint?.name ?? null;

        const assets = [...new Set(pointOfAttack.assets ?? [])]
            .map((assetId) => projectAssetsById.get(assetId))
            .filter((asset) => asset !== undefined);

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
