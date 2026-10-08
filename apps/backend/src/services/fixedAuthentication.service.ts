import { BadRequestError } from "#errors/bad-request.error.js";
import { buildThreatSeaAccessToken } from "#services/auth.service.js";
import { OidcProfile } from "#services/auth.service.js";

// Indexed by the `testUser` query parameter on /api/auth/login:
// - 0: the profile devs log in with locally; never used by the E2E suite, so it can't touch their data
// - 1–3: the primary (Owner) identity of the Chromium, Firefox and WebKit E2E projects
// - 4–9: two secondary identities (A, B) per browser for role-based E2E tests, in the same order
// Each browser has its own profiles so the three projects can run in parallel without interfering.
// The mapping lives in apps/frontend/playwright/utils/auth.api.ts.
const profiles: OidcProfile[] = [
    {
        firstName: "testfn",
        lastName: "testsn",
        email: "test@test.test",
        sub: "testid",
        emailVerified: true,
    },
    {
        firstName: "E2E",
        lastName: "Testing",
        email: "test2@test.test",
        sub: "testid2",
        emailVerified: true,
    },
    {
        firstName: "E2E",
        lastName: "Testing",
        email: "test3@test.test",
        sub: "testid3",
        emailVerified: true,
    },
    {
        firstName: "E2E",
        lastName: "Testing",
        email: "test4@test.test",
        sub: "testid4",
        emailVerified: true,
    },
    {
        firstName: "Chromium",
        lastName: "Secondary A",
        email: "test5@test.test",
        sub: "testid5",
        emailVerified: true,
    },
    {
        firstName: "Chromium",
        lastName: "Secondary B",
        email: "test6@test.test",
        sub: "testid6",
        emailVerified: true,
    },
    {
        firstName: "Firefox",
        lastName: "Secondary A",
        email: "test7@test.test",
        sub: "testid7",
        emailVerified: true,
    },
    {
        firstName: "Firefox",
        lastName: "Secondary B",
        email: "test8@test.test",
        sub: "testid8",
        emailVerified: true,
    },
    {
        firstName: "WebKit",
        lastName: "Secondary A",
        email: "test9@test.test",
        sub: "testid9",
        emailVerified: true,
    },
    {
        firstName: "WebKit",
        lastName: "Secondary B",
        email: "test10@test.test",
        sub: "testid10",
        emailVerified: true,
    },
];

function tryParseInt(str: string, defaultValue = 0) {
    const parsed = parseInt(str);
    return isNaN(parsed) ? defaultValue : parsed;
}

export function getFixedLoginToken(url: string): Promise<string> {
    const testUserId = tryParseInt(new URLSearchParams(url).get("/login?testUser")!);
    const profile = profiles[testUserId]!;

    if (!profile) {
        throw new BadRequestError(`Invalid test user ID: ${testUserId}`);
    }

    return buildThreatSeaAccessToken(profile);
}
