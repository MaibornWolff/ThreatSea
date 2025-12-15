import type { APIRequestContext } from "@playwright/test";
import type { Asset, CreateAssetRequest } from "#api/types/asset.types.ts";
import type { Catalog, CatalogWithRole, CreateCatalogRequest } from "#api/types/catalogs.types.ts";
import type { CatalogMeasure, CreateCatalogMeasureRequest } from "#api/types/catalog-measure.types.ts";
import type { CatalogThreat, CreateCatalogThreatRequest } from "#api/types/catalog-threat.types.ts";
import type { CreateProjectRequest, ExtendedProject, Project } from "#api/types/project.types.ts";
import type { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import type { ATTACKERS } from "#api/types/attackers.types.ts";
import type { CreateMeasureRequest, Measure } from "#api/types/measure.types.ts";

type HttpMethode = "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH";

const API_URI = `${process.env["API_URI"] ?? ""}/api`;

/**
 * Makes an API request using the specified HTTP method and endpoint.
 *
 * @param {APIRequestContext} request - The Playwright page instance.
 * @param {string} token The authorization token.
 * @param {string} method - The HTTP method.
 * @param {string} endpoint - The target endpoint for the API.
 * @param {object} data - Optional request data.
 * @returns {Promise<T>} A promise containing the server response.
 * @throws {Error} If the request fails.
 */
async function fetchApi<T>(
    request: APIRequestContext,
    token: string,
    method: HttpMethode,
    endpoint: string,
    data: object = {}
): Promise<T> {
    const response = await request.fetch(`${API_URI}${endpoint}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            "x-csrf-token": token,
        },
        data: data,
    });

    if (!response.ok()) {
        throw new Error(`Failed to fetch: ${response.status()}\n\t${response.statusText()}`);
    }

    try {
        return await response.json();
    } catch {
        return (await response.text()) as T;
    }
}

/**
 * Fetches all existing catalogs.
 *
 * @param {APIRequestContext} request - The Playwright page instance.
 * @param {string} token The authorization token.
 * @returns {Promise<CatalogWithRole[]>} A promise containing an array of catalog objects.
 */
export async function getCatalogs(request: APIRequestContext, token: string): Promise<CatalogWithRole[]> {
    return await fetchApi(request, token, "GET", "/catalogs");
}

/**
 * Fetches a catalog by its ID.
 *
 * @param {APIRequestContext} request - The Playwright page instance.
 * @param {string} token The authorization token.
 * @param {string} catalogId - The catalog ID.
 * @returns {Promise<CatalogWithRole>} A promise containing the catalog object.
 */
export async function getCatalog(
    request: APIRequestContext,
    token: string,
    catalogId: number
): Promise<CatalogWithRole> {
    return await fetchApi(request, token, "GET", `/catalog/${catalogId}`);
}

/**
 * Creates multiple catalogs.
 *
 * @param {APIRequestContext} request - The Playwright page instance.
 * @param {string} token The authorization token.
 * @param {CreateCatalogRequest[]} createCatalogRequests - An array of catalog objects to create.
 * @returns {Promise<Catalogs[]>} A promise that resolves when all catalogs are created.
 */
export async function createCatalogs(
    request: APIRequestContext,
    token: string,
    createCatalogRequests: CreateCatalogRequest[]
): Promise<Catalog[]> {
    const createdCatalogs: Catalog[] = [];
    for (const catalog of createCatalogRequests) {
        createdCatalogs.push(await createCatalog(request, token, catalog));
    }
    return createdCatalogs;
}

/**
 * Creates a single catalog.
 *
 * @param {APIRequestContext} request - The Playwright page instance.
 * @param {string} token The authorization token.
 * @param {CreateCatalogRequest} createCatalogRequest - The catalog object to create.
 * @returns {Promise<Catalog>} A promise that resolves when the catalog is created.
 */
export async function createCatalog(
    request: APIRequestContext,
    token: string,
    createCatalogRequest: CreateCatalogRequest
): Promise<Catalog> {
    return await fetchApi(request, token, "POST", "/catalogs", createCatalogRequest);
}

/**
 * Deletes all existing catalogs.
 *
 * @param {APIRequestContext} request - The Playwright page instance.
 * @param {string} token The authorization token.
 */
export async function deleteAllCatalogs(request: APIRequestContext, token: string) {
    const catalogs = await getCatalogs(request, token);
    await deleteCatalogs(
        request,
        token,
        catalogs.map((catalog) => catalog.id)
    );
}

/**
 * Deletes catalogs with the given catalog IDs.
 *
 * @param {APIRequestContext} request - The Playwright request instance.
 * @param {string} token The authorization token.
 * @param {number[]} catalogIds - An array of catalog IDs to delete.
 */
export async function deleteCatalogs(request: APIRequestContext, token: string, catalogIds: number[]) {
    for (const catalogId of catalogIds) {
        await deleteCatalog(request, token, catalogId);
    }
}

/**
 * Deletes a catalog by its catalog ID.
 *
 * @param {APIRequestContext} request - The Playwright request instance.
 * @param {string} token The authorization token.
 * @param {string} catalogId - The catalog ID to delete.
 */
export async function deleteCatalog(request: APIRequestContext, token: string, catalogId: number) {
    await fetchApi(request, token, "DELETE", `/catalogs/${catalogId}`);
}

/**
 * Fetches all existing projects.
 *
 * @param {APIRequestContext} request - The Playwright request instance.
 * @param {string} token The authorization token.
 * @returns {Promise<ExtendedProject[]>} A promise containing an array of project objects.
 */
export async function getProjects(request: APIRequestContext, token: string): Promise<ExtendedProject[]> {
    return await fetchApi(request, token, "GET", "/projects");
}

/**
 * Fetches a project by its ID.
 *
 * @param {APIRequestContext} request - The Playwright request instance.
 * @param {string} token The authorization token.
 * @param {string} projectId - The project ID.
 * @returns {Promise<ExtendedProject>} A promise containing the project object.
 */
export async function getProject(
    request: APIRequestContext,
    token: string,
    projectId: number
): Promise<ExtendedProject> {
    return await fetchApi(request, token, "GET", `/projects/${projectId}`);
}

/**
 * Creates multiple projects.
 *
 * @param {APIRequestContext} request - The Playwright request instance.
 * @param {string} token The authorization token.
 * @param {CreateProjectRequest[]} projects - An array of project objects to create.
 * @returns {Promise<Project[]>} A promise that resolves when all projects are created.
 */
export async function createProjects(
    request: APIRequestContext,
    token: string,
    projects: CreateProjectRequest[]
): Promise<Project[]> {
    const createdProjects: Project[] = [];
    for (const project of projects) {
        createdProjects.push(await createProject(request, token, project));
    }
    return createdProjects;
}

/**
 * Creates a single project.
 *
 * @param {APIRequestContext} request - The Playwright request instance.
 * @param {string} token The authorization token.
 * @param {object} project - The project object to create.
 * @returns {Promise<Project>} A promise that resolves when the project is created.
 */
export async function createProject(
    request: APIRequestContext,
    token: string,
    project: CreateProjectRequest
): Promise<Project> {
    return await fetchApi(request, token, "POST", "/projects", project);
}

/**
 * Deletes all existing projects.
 *
 * @param {APIRequestContext} request - The Playwright request instance.
 * @param {string} token The authorization token.
 */
export async function deleteAllProjects(request: APIRequestContext, token: string) {
    const projects = await getProjects(request, token);
    await deleteProjects(
        request,
        token,
        projects.map((project) => project.id)
    );
}

/**
 * Deletes projects with the given project IDs.
 *
 * @param {APIRequestContext} request - The Playwright request instance.
 * @param {string} token The authorization token.
 * @param {number[]} projectIds - An array of project IDs to delete.
 */
export async function deleteProjects(request: APIRequestContext, token: string, projectIds: number[]) {
    for (const projectId of projectIds) {
        await deleteProject(request, token, projectId);
    }
}

/**
 * Deletes a project by its project ID.
 *
 * @param {APIRequestContext} request - The Playwright request instance.
 * @param {string} token The authorization token.
 * @param {number} projectId - The project ID to delete.
 */
export async function deleteProject(request: APIRequestContext, token: string, projectId: number) {
    await fetchApi(request, token, "DELETE", `/projects/${projectId}`);
}

/**
 * Fetches all existing assets from a project.
 *
 * @param {APIRequestContext} request - The Playwright request instance.
 * @param {string} token The authorization token.
 * @param {number} projectId - The project ID.
 * @returns {Promise<Asset[]>} A promise containing an array of asset objects.
 */
export async function getAssets(request: APIRequestContext, token: string, projectId: number): Promise<Asset[]> {
    return await fetchApi(request, token, "GET", `/projects/${projectId}/assets`);
}

/**
 * Creates multiple assets.
 *
 * @param {APIRequestContext} request - The Playwright request instance.
 * @param {string} token The authorization token.
 * @param {CreateAssetRequest[]} assets - An array of asset objects to create.
 * @returns {Promise<Asset[]>} A promise that resolves when all assets are created.
 */
export async function createAssets(
    request: APIRequestContext,
    token: string,
    assets: CreateAssetRequest[]
): Promise<Asset[]> {
    const createdAssets = [];
    for (const asset of assets) {
        createdAssets.push(await createAsset(request, token, asset));
    }
    return createdAssets;
}

/**
 * Creates a single asset.
 *
 * @param {APIRequestContext} request - The Playwright request instance.
 * @param {string} token The authorization token.
 * @param {CreateAssetRequest} asset - The asset object to create.
 * @returns {Promise<Asset>} A promise that resolves when the asset is created.
 */
export async function createAsset(
    request: APIRequestContext,
    token: string,
    asset: CreateAssetRequest
): Promise<Asset> {
    return await fetchApi(request, token, "POST", `/projects/${asset.projectId}/assets`, asset);
}

/**
 * Fetches all existing threats from a catalog.
 *
 * @param {APIRequestContext} request - The Playwright request instance.
 * @param {string} token The authorization token.
 * @param {string} catalogId - The catalog ID.
 * @returns {Promise<CatalogThreat[]>} A promise containing an array of catalog threat objects.
 */
export async function getCatalogThreats(
    request: APIRequestContext,
    token: string,
    catalogId: number
): Promise<CatalogThreat[]> {
    return await fetchApi(request, token, "GET", `/catalogs/${catalogId}/threats`);
}

/**
 * Creates multiple catalog threats.
 *
 * @param {APIRequestContext} request - The Playwright request instance.
 * @param {string} token The authorization token.
 * @param {Array<object[]>} threats - An array of threats objects to create.
 * @returns {Promise<CatalogThreat[]>} A promise that resolves when all threats are created.
 */
export async function createCatalogThreats(
    request: APIRequestContext,
    token: string,
    createCatalogThreatRequests: {
        name: string;
        description: string;
        pointsOfAttack: POINTS_OF_ATTACK[];
        attackers: ATTACKERS[];
        probability: number;
        confidentiality: boolean;
        integrity: boolean;
        availability: boolean;
        catalogId: number;
        createdAt: Date;
    }[]
): Promise<CatalogThreat[]> {
    const createdThreats: CatalogThreat[] = [];
    for (const createCatalogThreatRequest of createCatalogThreatRequests) {
        const { attackers, pointsOfAttack, ...createThreatRequest } = createCatalogThreatRequest;
        for (const attacker of attackers) {
            for (const pointOfAttack of pointsOfAttack) {
                const convertedCreateCatalogThreatRequest: CreateCatalogThreatRequest = {
                    ...createThreatRequest,
                    attacker: attacker,
                    pointOfAttack: pointOfAttack,
                };

                createdThreats.push(await createCatalogThreat(request, token, convertedCreateCatalogThreatRequest));
            }
        }
    }
    return createdThreats;
}

/**
 * Creates a single catalog threats.
 *
 * @param {APIRequestContext} request - The Playwright request instance.
 * @param {string} token The authorization token.
 * @param {CreateCatalogThreatRequest} createCatalogThreatRequest - Request object to create a catalog threat.
 * @returns {Promise<CatalogThreat>} A promise that resolves when all threats are created.
 */
export async function createCatalogThreat(
    request: APIRequestContext,
    token: string,
    createCatalogThreatRequest: CreateCatalogThreatRequest
): Promise<CatalogThreat> {
    const { catalogId, ...body } = createCatalogThreatRequest;
    return await fetchApi(request, token, "POST", `/catalogs/${catalogId}/threats`, body);
}

/**
 * Deletes all catalog threats by its given id's
 *
 * @param {APIRequestContext} request - The Playwright request instance.
 * @param {string} token The authorization token.
 * @param {number} catalogId The catalog id.
 * @param {number[]} threatIds The ids' of the catalog threats to delete.
 */
export async function deleteCatalogThreats(
    request: APIRequestContext,
    token: string,
    catalogId: number,
    threatIds: number[]
) {
    for (const threatId of threatIds) {
        await fetchApi(request, token, "DELETE", `/catalogs/${catalogId}/threats/${threatId}`);
    }
}

/**
 * Fetches all existing measures from a catalog.
 *
 * @param {APIRequestContext} request - The Playwright request instance.
 * @param {string} token The authorization token.
 * @param {number} catalogId The catalog id.
 * @returns {Promise<CatalogMeasure[]>} A promise containing an array of catalog measure objects.
 */
export async function getCatalogMeasures(
    request: APIRequestContext,
    token: string,
    catalogId: number
): Promise<CatalogMeasure[]> {
    return await fetchApi(request, token, "GET", `/catalogs/${catalogId}/measures`);
}

/**
 * Creates multiple catalog measures.
 *
 * @param {APIRequestContext} request - The Playwright request instance.
 * @param {string} token The authorization token.
 * @param {object[]} createCatalogMeasureRequests - An array of catalog measure objects to create.
 * @returns {Promise<CatalogMeasure[]>} A promise that resolves when all catalog measures are created.
 */
export async function createCatalogMeasures(
    request: APIRequestContext,
    token: string,
    createCatalogMeasureRequests: {
        name: string;
        description: string;
        pointsOfAttack: POINTS_OF_ATTACK[];
        attackers: ATTACKERS[];
        probability: number;
        confidentiality: boolean;
        integrity: boolean;
        availability: boolean;
        catalogId: number;
        createdAt: Date;
    }[]
): Promise<CatalogMeasure[]> {
    const createdMeasures: CatalogMeasure[] = [];
    for (const createCatalogMeasureRequest of createCatalogMeasureRequests) {
        const { attackers, pointsOfAttack, ...createMeasureRequest } = createCatalogMeasureRequest;
        for (const attacker of attackers) {
            for (const pointOfAttack of pointsOfAttack) {
                const convertedCreateCatalogMeasureRequest: CreateCatalogMeasureRequest = {
                    ...createMeasureRequest,
                    attacker: attacker,
                    pointOfAttack: pointOfAttack,
                };

                createdMeasures.push(await createCatalogMeasure(request, token, convertedCreateCatalogMeasureRequest));
            }
        }
    }
    return createdMeasures;
}

/**
 * Creates a single catalog measure.
 *
 * @param {APIRequestContext} request - The Playwright request instance.
 * @param {string} token The authorization token.
 * @param {CreateCatalogMeasureRequest} createCatalogMeasureRequest - A measure to create.
 * @returns {Promise<CatalogMeasure>} A promise that resolves when all threats are created.
 */
export async function createCatalogMeasure(
    request: APIRequestContext,
    token: string,
    createCatalogMeasureRequest: CreateCatalogMeasureRequest
): Promise<CatalogMeasure> {
    const { catalogId, ...body } = createCatalogMeasureRequest;
    return await fetchApi(request, token, "POST", `/catalogs/${catalogId}/measures`, body);
}

/**
 * Deletes all catalog measures by its given ids'
 *
 * @param {APIRequestContext} request - The Playwright request instance.
 * @param {string} token The authorization token.
 * @param {number} catalogId The catalog id.
 * @param {number[]} measureIds The id's of the catalog threats to delete.
 */
export async function deleteCatalogMeasures(
    request: APIRequestContext,
    token: string,
    catalogId: number,
    measureIds: number[]
) {
    for (const measureId of measureIds) {
        await fetchApi(request, token, "DELETE", `/catalogs/${catalogId}/measures/${measureId}`);
    }
}

/**
 * Creates multiple catalog measures.
 *
 * @param {APIRequestContext} request - The Playwright request instance.
 * @param {string} token The authorization token.
 * @param {CreateMeasureRequest[]} createMeasureRequests - An array of catalog measure objects to create.
 * @returns {Promise<Measure[]>} A promise that resolves when all catalog measures are created.
 */
export async function createMeasures(
    request: APIRequestContext,
    token: string,
    createMeasureRequests: CreateMeasureRequest[]
): Promise<Measure[]> {
    const createdMeasures: Measure[] = [];
    for (const createMeasureRequest of createMeasureRequests) {
        createdMeasures.push(await createMeasure(request, token, createMeasureRequest));
    }
    return createdMeasures;
}

/**
 * Creates a single measure.
 *
 * @param {APIRequestContext} request - The Playwright request instance.
 * @param {string} token The authorization token.
 * @param {CreateMeasureRequest} createMeasureRequest - A measure to create.
 * @returns {Promise<Measure>} A promise that resolves when all threats are created.
 */
export async function createMeasure(
    request: APIRequestContext,
    token: string,
    createMeasureRequest: CreateMeasureRequest
): Promise<Measure> {
    const { projectId, ...body } = createMeasureRequest;
    return fetchApi(request, token, "POST", `/projects/${projectId}/system/measures`, body);
}

/**
 * Imports a project
 *
 * @param {APIRequestContext} request - The Playwright request instance.
 * @param {string} token The authorization token.
 * @param {object} project The project to import.
 */
export async function importProject(request: APIRequestContext, token: string, project: object) {
    return fetchApi<void>(request, token, "POST", "/import", project);
}

/**
 * Deletes all projects and catalogs.
 *
 * @param {APIRequestContext} request - The Playwright request instance.
 * @param {string} token The authorization token.
 */
export async function clean(request: APIRequestContext, token: string) {
    await deleteAllProjects(request, token);
    await deleteAllCatalogs(request, token);
}

export function browserNameTestId(browserName: string, testId: string): string {
    return `${browserName}-${testId.slice(0, 16)}`;
}
