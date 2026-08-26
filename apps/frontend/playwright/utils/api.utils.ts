import type { APIRequestContext, APIResponse } from "@playwright/test";

type HttpMethod = "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH";

const API_URI_BASE = process.env["API_URI"];
if (!API_URI_BASE) {
    throw new Error("Environment variable API_URI is not set.");
}
const API_URI = `${API_URI_BASE}/api`;

function buildRequestOptions(
    token: string,
    method: HttpMethod,
    data: object
): Parameters<APIRequestContext["fetch"]>[1] {
    const options: Parameters<APIRequestContext["fetch"]>[1] = {
        method,
        headers: {
            "Content-Type": "application/json",
            "x-csrf-token": token,
        },
    };
    if (method !== "GET" && method !== "HEAD") {
        options.data = data;
    }
    return options;
}

/**
 * Makes an API request using the specified HTTP method and endpoint.
 */
export async function fetchApi<T>(
    request: APIRequestContext,
    token: string,
    method: HttpMethod,
    endpoint: string,
    data: object = {}
): Promise<T> {
    const response = await request.fetch(`${API_URI}${endpoint}`, buildRequestOptions(token, method, data));

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
 * Makes an API request and returns the raw response instead of throwing on a non-2xx status.
 * Used by negative-path tests that assert on the status code of a request that is expected
 * to be rejected (e.g. an authorization check).
 */
export async function fetchApiRaw(
    request: APIRequestContext,
    token: string,
    method: HttpMethod,
    endpoint: string,
    data: object = {}
): Promise<APIResponse> {
    return request.fetch(`${API_URI}${endpoint}`, buildRequestOptions(token, method, data));
}
