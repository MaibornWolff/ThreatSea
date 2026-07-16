/**
 * @module utils - Defines utility
 *     functions and variables for the api.
 */
import { CsrfApi } from "#api/csrf.api.ts";

export const API_URI = `${import.meta.env["VITE_API_URI"] ?? ""}/api`;

/**
 * Saves the csrf token as a string inside the local storage.
 * @param {string} token - csrf token.
 */
function setCSRFToken(token: string) {
    localStorage.setItem("csrfToken", token);
}

/**
 * Fetches the csrf token from the local storage.
 * @returns The csrf token as an object or null if it doesn't exist.
 */
function getCSRFToken(): string {
    return localStorage.getItem("csrfToken") ?? "";
}

let intervalId: number | null = null;

/**
 * Starts an interval to refresh the CSRF token every 15 minutes.
 *
 * The CSRF token is only used for API requests and not used in any component.
 * Therefore, it is not necessary to handle the CSRF token with Redux.
 * @returns {Promise<void>}
 */
export async function startTokenRefresh(): Promise<void> {
    if (intervalId) {
        clearInterval(intervalId);
    }

    const token = await CsrfApi.getToken();
    setCSRFToken(token);

    intervalId = setInterval(
        () => {
            void (async () => {
                try {
                    const token = await CsrfApi.getToken();
                    setCSRFToken(token);
                } catch {
                    // Silently ignore – session expiry is handled by fetchAPI's
                    // renewal mechanism on the next real API call.
                }
            })();
        },
        15 * 60 * 1000
    );
}

/**
 * Coalescing promise for concurrent session renewals. All requests that hit a
 * proxy redirect at the same time share a single renewal call.
 */
let sessionRefreshPromise: Promise<void> | null = null;

/**
 * Calls the backend's OIDC refresh-token endpoint to silently renew the
 * upstream proxy session. Throws an AuthenticationError on any failure so
 * the Redux error handler can redirect the user to login.
 */
async function renewSession(): Promise<void> {
    try {
        const response = await fetch(`${API_URI}/auth/refresh`, {
            method: "POST",
            credentials: "include",
            redirect: "error",
            headers: { "x-csrf-token": getCSRFToken() },
        });
        if (!response.ok) {
            throw new Error();
        }
    } catch {
        const err = new Error("Your session has expired. Please log in again.");
        err.name = "AuthenticationError";
        throw err;
    }
}

/**
 * Cleanup function to stop the CSRF token refresh interval.
 */
export function stopTokenRefresh() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
}

/**
 * Fetch api wrapper function which sends requests to a given
 * url.
 *
 * @param {string} endpoint - The directory path of the url.
 *     data from the fetch api call is unwrapped.
 * @param {object} config - Fetch api configuration object e.g post or get request.
 * @param {function} fetchDataFunc - Function that defines how the returned
 *     data from the fetch api call is unwrapped.
 * @param retry - Whether to retry the request if it fails due to an invalid CSRF token.
 * @returns The data received from the requested url.
 * @throws An error received from the fetch api response.
 */
export async function fetchAPI<T>(
    endpoint: string,
    config: {
        headers?: Record<string, string>;
        method: string;
        body?: string;
    } | null = null,
    fetchDataFunc: ((data: unknown) => T) | null = null,
    retry = true
): Promise<T> {
    const { headers = {} } = config || {};
    const fetchHeaders = {
        ...headers,
        "x-csrf-token": getCSRFToken(),
    };

    const response = await fetch(`${API_URI}${endpoint}`, {
        ...config,
        headers: fetchHeaders,
        credentials: "include",
        redirect: "manual",
    });

    // An upstream proxy (e.g. Azure AD App Proxy) has redirected the request
    // to an external auth endpoint. Following that redirect via fetch would
    // violate CSP. Instead, attempt a silent OIDC session renewal via the
    // backend's refresh-token endpoint and replay the original request once.
    if (response.type === "opaqueredirect") {
        if (!retry) {
            const err = new Error("Your session has expired. Please log in again.");
            err.name = "AuthenticationError";
            throw err;
        }

        if (!sessionRefreshPromise) {
            sessionRefreshPromise = renewSession().finally(() => {
                sessionRefreshPromise = null;
            });
        }

        await sessionRefreshPromise;
        return fetchAPI(endpoint, config, fetchDataFunc, false);
    }

    if (!response.ok) {
        const data = await response.json();

        if (retry && data.code === "INVALIDCSRFTOKEN") {
            await startTokenRefresh();
            return fetchAPI(endpoint, config, fetchDataFunc, false);
        }

        const error = new Error(`${data.type}: ${data.message}${data.logId ? ` | ${data.logId}` : ""}`);

        error.name = data.type;

        throw error;
    }

    let result;
    if (response.status !== 204) {
        const data = await response.json();
        result = fetchDataFunc ? fetchDataFunc(data) : data;
    }

    return result;
}
