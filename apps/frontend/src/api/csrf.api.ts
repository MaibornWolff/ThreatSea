/**
 * @module csrf.api - Defines api calls to the backend
 *    related to the csrf token
 */
import { fetchAPI } from "#api/utils.ts";

/**
 * Wrapper class for the api function csrfToken.
 */
export class CsrfApi {
    /**
     * Get the csrf-token associated with the users session
     */
    static async getToken(): Promise<string> {
        return await fetchAPI(
            "/csrf-token",
            {
                method: "GET",
            },
            (res) => {
                const tokenResponse = res as { token: string };
                return tokenResponse["token"];
            },
            false
        );
    }
}
