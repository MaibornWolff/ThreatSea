/**
 * @module login.api - Defines api calls to the backend
 *    related to the user login.
 */
import { fetchAPI } from "#api/utils.ts";

/**
 * Wrapper class for the api function of a login.
 */
export class LoginAPI {
    /**
     * Get the authentication mode defined in the backend.
     * @returns Current authentication mode
     */
    static async getAuthenticationMode(): Promise<string> {
        return await fetchAPI(
            "/auth/authenticationMode",
            {
                method: "GET",
            },
            (res) => {
                const authenticationModeResponse = res as { authenticationMode: string };
                return authenticationModeResponse["authenticationMode"];
            }
        );
    }

    static async getAuthenticationStatus(): Promise<{ status: { isLoggedIn: boolean } }> {
        return await fetchAPI("/auth/status", null, (res) => {
            const statusResponse = res as {
                data: { status: { isLoggedIn: boolean } };
                message: string;
            };
            return statusResponse.data;
        });
    }

    static async logOut() {
        await fetchAPI<void>("/auth/logout", {
            method: "POST",
        });
    }
}
