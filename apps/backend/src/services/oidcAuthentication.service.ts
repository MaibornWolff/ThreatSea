import passport from "passport";
import OpenIDConnectStrategy from "passport-openidconnect";
import { oidcConfig } from "#config/config.js";
import { Logger } from "#logging/index.js";
import { buildThreatSeaAccessToken } from "#services/auth.service.js";
import { azurePrivilegeCheck } from "#services/privilegeChecks/azurePrivilegeCheck.js";
import { mergeOidcProfile } from "#utils/mergeOidcProfile.js";

const verify = (
    _issuer: string,
    sub: string | Record<string, unknown>,
    profile: OpenIDConnectStrategy.Profile,
    _accessToken: string,
    refreshToken: string,
    _params: unknown,
    done: OpenIDConnectStrategy.VerifyCallback
): void => {
    const user = mergeOidcProfile(sub, profile);

    azurePrivilegeCheck(refreshToken)
        .then((isPrivileged) => buildThreatSeaAccessToken(user, isPrivileged))
        .then((threatSeaToken) => {
            done(undefined, { threatSeaToken: threatSeaToken });
        }) // pass threatSeaToken in user object as passport is not setup for session management
        .catch((err) => {
            Logger.error("Error in preparing Token", err);
            done(err, undefined);
        });
};

passport.use(
    "oidc",
    new OpenIDConnectStrategy.Strategy(
        {
            issuer: oidcConfig.issuer,
            authorizationURL: oidcConfig.authorizationURL,
            tokenURL: oidcConfig.tokenURL,
            userInfoURL: oidcConfig.userInfoURL,
            clientID: oidcConfig.clientId,
            clientSecret: oidcConfig.clientSecret,
            callbackURL: oidcConfig.callbackURL,
            scope: "openid profile email User.Read GroupMember.Read.All",
            passReqToCallback: false,
        },
        verify as unknown as OpenIDConnectStrategy.VerifyFunction
    )
);
