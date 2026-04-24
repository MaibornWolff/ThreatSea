import type { APIRequestContext } from "@playwright/test";

type HttpMethod = "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH";

const API_URI = `${process.env["API_URI"] ?? ""}/api`;

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
    const response = await request.fetch(`${API_URI}${endpoint}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            "x-csrf-token": token,
        },
        data,
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

