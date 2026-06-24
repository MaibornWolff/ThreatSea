import type { SystemPointOfAttack } from "#api/types/system.types.ts";

export type CreatePointOfAttackArgs = Pick<SystemPointOfAttack, "id" | "type" | "projectId" | "componentId"> &
    Partial<Omit<SystemPointOfAttack, "id" | "type" | "projectId" | "componentId">>;

/**
 * Pure: it derives output from input only and dispatches nothing.
 */
export const buildPointOfAttackPayload = (data: CreatePointOfAttackArgs): SystemPointOfAttack => {
    return {
        id: data.id,
        type: data.type,
        projectId: data.projectId,
        componentId: data.componentId,
        connectionId: data.connectionId ?? null,
        connectionPointId: data.connectionPointId ?? null,
        name: data.name ?? null,
        componentName: data.componentName ?? null,
        assets: data.assets ?? [],
    };
};
