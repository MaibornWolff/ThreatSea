/**
 * Module that defines access and manipulation
 * of the components.
 */
import { eq, and, ne } from "drizzle-orm";
import { db, TransactionType } from "#db/index.js";
import { ComponentType, componentTypes, CreateComponentType, UpdateComponentType } from "#db/schema.js";
import { ConflictError } from "#errors/conflict.error.js";

/**
 * Gets all custom components of the specified project.
 *
 * @param {number} projectId - The id of the current project.
 * @returns {Promise<ComponentType[]>} A promise that resolves to an array of component types.
 */
export async function getComponentTypes(projectId: number): Promise<ComponentType[]> {
    return await db.query.componentTypes.findMany({
        where: eq(componentTypes.projectId, projectId),
    });
}

/**
 * Gets a component type by its id.
 *
 * @param {number} componentTypeId - The id of the component type.
 * @returns {Promise<ComponentType | null>} A promise that resolves to the component type or null if not found.
 */
export async function getComponentType(componentTypeId: number): Promise<ComponentType | null> {
    const componentType = await db.query.componentTypes.findFirst({ where: eq(componentTypes.id, componentTypeId) });

    return componentType ?? null;
}

/**
 * Creates a new component type.
 *
 * @param {CreateComponentType} createComponentTypeData - Component data.
 * @param {TransactionType} transaction - drizzle transaction
 * @returns {Promise<ComponentType>} A promise that resolves to the created component type.
 * @throws {Error} If the component type could not be created.
 */
export async function createComponentType(
    createComponentTypeData: CreateComponentType,
    transaction: TransactionType | undefined = undefined
): Promise<ComponentType> {
    const componentTypesWithDuplicateName = await db.query.componentTypes.findFirst({
        where: and(
            eq(componentTypes.projectId, createComponentTypeData.projectId),
            eq(componentTypes.name, createComponentTypeData.name)
        ),
    });

    if (componentTypesWithDuplicateName != null) {
        throw new ConflictError("Component name is not unique");
    }

    const [componentType] = await (transaction ?? db)
        .insert(componentTypes)
        .values({ ...createComponentTypeData })
        .returning();

    if (!componentType) {
        throw new Error("Failed to create component type");
    }

    return componentType;
}

/**
 * Updates the component type with the specified data.
 *
 * @param {number} projectId - The id of the current project.
 * @param componentTypeId - The id of the component type to update.
 * @param updateComponentType - The data of the component type.
 * @returns {Promise<ComponentType>} A promise that resolves to the updated component type.
 * @throws {Error} If the component type could not be updated.
 */
export async function updateComponentType(
    projectId: number,
    componentTypeId: number,
    updateComponentType: UpdateComponentType
): Promise<ComponentType> {
    const componentTypesWithDuplicateName = await db.query.componentTypes.findFirst({
        where: and(
            eq(componentTypes.projectId, projectId),
            eq(componentTypes.name, updateComponentType.name),
            ne(componentTypes.id, componentTypeId)
        ),
    });

    if (componentTypesWithDuplicateName != null) {
        throw new ConflictError("Component name is not unique");
    }

    const [componentType] = await db
        .update(componentTypes)
        .set(updateComponentType)
        .where(eq(componentTypes.id, componentTypeId))
        .returning();

    if (!componentType) {
        throw new Error("Failed to update component type");
    }

    return componentType;
}

/**
 * Deletes the component type with the specified id.
 *
 * @param {number} componentTypeId - The id of the component type to delete.
 * @returns {Promise<void>} A promise that resolves when the component type is deleted.
 */
export async function deleteComponentType(componentTypeId: number): Promise<void> {
    await db.delete(componentTypes).where(eq(componentTypes.id, componentTypeId));
}
