import type { APIRequestContext } from "@playwright/test";
import type { CreateProjectRequest, ExtendedProject, Project } from "#api/types/project.types.ts";
import { fetchApi } from "../utils/api.utils.ts";

export async function getProjects(request: APIRequestContext, token: string): Promise<ExtendedProject[]> {
    return fetchApi(request, token, "GET", "/projects");
}

export async function getProject(
    request: APIRequestContext,
    token: string,
    projectId: number
): Promise<ExtendedProject> {
    return fetchApi(request, token, "GET", `/projects/${projectId}`);
}

export async function createProject(
    request: APIRequestContext,
    token: string,
    body: CreateProjectRequest
): Promise<Project> {
    return fetchApi(request, token, "POST", "/projects", body);
}

export async function createProjects(
    request: APIRequestContext,
    token: string,
    bodies: CreateProjectRequest[]
): Promise<Project[]> {
    const results: Project[] = [];
    for (const body of bodies) {
        results.push(await createProject(request, token, body));
    }
    return results;
}

export async function deleteProject(request: APIRequestContext, token: string, projectId: number): Promise<void> {
    await fetchApi(request, token, "DELETE", `/projects/${projectId}`);
}

export async function deleteProjects(request: APIRequestContext, token: string, projectIds: number[]): Promise<void> {
    for (const id of projectIds) {
        await deleteProject(request, token, id);
    }
}

export async function deleteAllProjects(request: APIRequestContext, token: string): Promise<void> {
    const projects = await getProjects(request, token);
    await deleteProjects(
        request,
        token,
        projects.map((p) => p.id)
    );
}

export async function importProject(request: APIRequestContext, token: string, project: object): Promise<void> {
    return fetchApi<void>(request, token, "POST", "/import", project);
}
