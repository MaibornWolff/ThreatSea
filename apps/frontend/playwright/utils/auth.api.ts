import { request as apiRequest, type Page } from "@playwright/test";

const API_URI_BASE = process.env["API_URI"];
if (!API_URI_BASE) {
    throw new Error("Environment variable API_URI is not set.");
}

/**
 * Fixed E2E login profiles from the backend's fixedAuthentication.service.ts (indexed the same
 * way as the `testUser` query parameter on `/api/auth/login`). Indices 0 and 1 are never used
 * as the primary browser identity in auth.setup.ts (chromium=2, firefox=3, webkit=4), so they
 * are safe to provision as secondary, addable members without colliding with the acting user.
 */
export const SECONDARY_TEST_USER_A = { testUserIndex: 0, name: "testfn testsn", email: "test@test.test" } as const;
export const SECONDARY_TEST_USER_B = { testUserIndex: 1, name: "E2E Testing", email: "test2@test.test" } as const;

/**
 * Provisions one of the fixed E2E login profiles at the API level only, using a request
 * context that is isolated from the current browser session and from the `request` test
 * fixture. This upserts the profile's user row in the database so it becomes visible as an
 * "addable" member, without touching the current test's own authenticated session.
 */
export async function provisionFixedTestUser(testUserIndex: number): Promise<void> {
    const isolatedContext = await apiRequest.newContext();
    try {
        const response = await isolatedContext.get(`${API_URI_BASE}/api/auth/login?testUser=${testUserIndex}`);
        if (!response.ok()) {
            throw new Error(`Failed to provision fixed test user ${testUserIndex}: ${response.status()}`);
        }
    } finally {
        await isolatedContext.dispose();
    }
}

/**
 * Logs the given page in as one of the fixed E2E profiles, replacing whichever identity it
 * currently holds. Used to act as a lower-privileged member (Editor/Viewer) within a single
 * test. This only ever changes the browser context behind `page` — the `request` fixture keeps
 * its own, independent cookie jar seeded from the project's storageState, so tokens obtained
 * from `request`/`getCsrfToken()` before the swap keep acting as the original owner afterward.
 *
 * The CSRF token is scoped to the express-session cookie, not to the logged-in identity (see
 * csrf-sync in server.ts), so it stays the same across this swap — it's not a usable signal that
 * the new identity has taken effect. Waiting for the Projects page to render instead confirms the
 * new accessToken cookie is active and the app has loaded data for the new user.
 */
export async function loginAsFixedTestUser(page: Page, testUserIndex: number): Promise<void> {
    await page.goto(`${API_URI_BASE}/api/auth/login?testUser=${testUserIndex}`);
    await page.goto("/projects");
    await page.getByRole("heading", { name: "Projects" }).waitFor();
}
