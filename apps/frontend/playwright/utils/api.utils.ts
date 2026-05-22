import type { APIRequestContext } from "@playwright/test";

type HttpMethod = "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH";

const API_URI_BASE = process.env["API_URI"];
if (!API_URI_BASE) {
    throw new Error("Environment variable API_URI is not set.");
}
const API_URI = `${API_URI_BASE}/api`;

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
    const response = await request.fetch(`${API_URI}${endpoint}`, options);

    if (!response.ok()) {
        throw new Error(`Failed to fetch: ${response.status()}\n\t${response.statusText()}`);
    }

    try {
        return await response.json();
    } catch {
        return (await response.text()) as T;
    }
}
