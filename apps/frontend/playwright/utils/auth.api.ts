import { request as apiRequest, type Page } from "@playwright/test";

const API_URI_BASE = process.env["API_URI"];
if (!API_URI_BASE) {
    throw new Error("Environment variable API_URI is not set.");
}

export interface FixedTestUser {
    testUserIndex: number;
    name: string;
    email: string;
}

export interface BrowserTestUsers {
    /** The primary identity auth.setup.ts logs the browser in as; owns everything the tests create. */
    ownerIndex: number;
    /** Secondary identities a test adds as members to act as a lower-privileged role. */
    secondaryA: FixedTestUser;
    secondaryB: FixedTestUser;
}

/**
 * Fixed E2E login profiles from the backend's fixedAuthentication.service.ts (indexed the same
 * way as the `testUser` query parameter on `/api/auth/login`). Each browser gets its own owner
 * and secondary identities, so the three projects can run in parallel without one browser's
 * tests adding, swapping into or removing another browser's users. Index 0 is deliberately
 * absent: it's the profile devs log in with locally, and E2E runs must not touch its data.
 */
const BROWSER_TEST_USERS: Record<string, BrowserTestUsers> = {
    chromium: {
        ownerIndex: 1,
        secondaryA: { testUserIndex: 4, name: "Chromium Secondary A", email: "test5@test.test" },
        secondaryB: { testUserIndex: 5, name: "Chromium Secondary B", email: "test6@test.test" },
    },
    firefox: {
        ownerIndex: 2,
        secondaryA: { testUserIndex: 6, name: "Firefox Secondary A", email: "test7@test.test" },
        secondaryB: { testUserIndex: 7, name: "Firefox Secondary B", email: "test8@test.test" },
    },
    webkit: {
        ownerIndex: 3,
        secondaryA: { testUserIndex: 8, name: "WebKit Secondary A", email: "test9@test.test" },
        secondaryB: { testUserIndex: 9, name: "WebKit Secondary B", email: "test10@test.test" },
    },
};

/** Returns the fixed login profiles reserved for the given browser project. */
export function fixedTestUsersFor(browserName: string): BrowserTestUsers {
    const users = BROWSER_TEST_USERS[browserName];
    if (!users) {
        throw new Error(`No fixed login profiles are mapped to browser "${browserName}".`);
    }
    return users;
}

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
