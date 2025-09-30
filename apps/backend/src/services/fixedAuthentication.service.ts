import passport from "passport";
import * as CustomStrategy from "passport-custom";
import { AzureProfile, buildThreatSeaAccessToken } from "#services/auth.service.js";
import { Logger } from "#logging/index.js";

const strategySelector = "fixed";

const profiles: AzureProfile[] = [
    {
        _json: {
            givenName: "testfn",
            surname: "testsn",
            userPrincipalName: "test@test.test",
        },
        id: "testid",
    },
    {
        _json: {
            givenName: "testIHave",
            surname: "testNoPrivileges",
            userPrincipalName: "test2@test.test",
        },
        id: "testid2",
    },
    {
        _json: {
            givenName: "E2E",
            surname: "Testing",
            userPrincipalName: "test3@test.test",
        },
        id: "testid3",
    },
    {
        _json: {
            givenName: "E2E",
            surname: "Testing",
            userPrincipalName: "test4@test.test",
        },
        id: "testid4",
    },
    {
        _json: {
            givenName: "E2E",
            surname: "Testing",
            userPrincipalName: "test5@test.test",
        },
        id: "testid5",
    },
];

function tryParseInt(str: string, defaultValue = 0) {
    const parsed = parseInt(str);
    return isNaN(parsed) ? defaultValue : parsed;
}

const fixedStrategy = new CustomStrategy.Strategy(function (req, done) {
    let isPrivileged;
    const testUserId = tryParseInt(new URLSearchParams(req.url).get("/login?testUser")!);

    const profile = profiles[testUserId]!;
    if (testUserId === 1) {
        isPrivileged = 0;
    } else {
        isPrivileged = 1;
    }

    buildThreatSeaAccessToken(profile, isPrivileged)
        .then((threatSeaToken) => {
            done(null, { threatSeaToken: threatSeaToken });
        }) // pass threatSeaToken in user object as passport is not setup for session management
        .catch((err) => {
            Logger.error("Error in preparing Token", err);
            done(err, false);
        });
});

passport.use(strategySelector, fixedStrategy);
