/**
 * @module component-type.api - Defines the api calls
 *     for the custom components.
 */
import type {
    ComponentType,
    CreateComponentTypeRequest,
    UpdateComponentTypeRequest,
} from "#api/types/component-types.types.ts";
import { fetchAPI } from "#api/utils.ts";

/**
 * Wrapper class that defines the api function
 * for the custom components.
 */
export class ComponentTypeAPI {
    /**
     * Gets all custom components of a project.
     * @param {number} projectId - id of the current project.
     * @returns Array of custom component objects.
     */
    static async getComponentTypes({ projectId }: { projectId: number }): Promise<ComponentType[]> {
        return await fetchAPI(`/projects/${projectId}/componentTypes`);
    }

    /**
     * Creates a custom component inside the backend.
     * @param {CreateComponentTypeRequest} data - Data of the custom component.
     * @returns The created custom component.
     */
    static async createComponentType(data: CreateComponentTypeRequest): Promise<ComponentType> {
        const { projectId, ...body } = data;

        return await fetchAPI(`/projects/${projectId}/componentTypes`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    /**
     * Updates a custom component inside the backend.
     * @param {UpdateComponentTypeRequest} data - Data of the custom component.
     * @returns The updated custom component.
     */
    static async updateComponentType(data: UpdateComponentTypeRequest): Promise<ComponentType> {
        const { id, projectId, ...body } = data;

        return await fetchAPI(`/projects/${projectId}/componentTypes/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    /**
     * Deletes a custom component inside the backend.
     * @param {ComponentType} data - Data of the custom component.
     */
    static async deleteComponentType(data: ComponentType) {
        await fetchAPI<void>(`/projects/${data.projectId}/componentTypes/${data.id}`, {
            method: "DELETE",
        });
    }
}
