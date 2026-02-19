import { BadRequestError } from "#errors/bad-request.error.js";
import { buildThreatSeaAccessToken } from "#services/auth.service.js";
import { OidcProfile } from "#services/auth.service.js";

const profiles: OidcProfile[] = [
    {
        firstName: "testfn",
        lastName: "testsn",
        email: "test@test.test",
        sub: "testid",
    },
    {
        firstName: "testIHave",
        lastName: "testNoPrivileges",
        email: "test2@test.test",
        sub: "testid2",
    },
    {
        firstName: "E2E",
        lastName: "Testing",
        email: "test3@test.test",
        sub: "testid3",
    },
    {
        firstName: "E2E",
        lastName: "Testing",
        email: "test4@test.test",
        sub: "testid4",
    },
    {
        firstName: "E2E",
        lastName: "Testing",
        email: "test5@test.test",
        sub: "testid5",
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
