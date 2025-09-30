import passport from "passport";
import * as MicrosoftStrategy from "passport-microsoft";
import { azureConfig, originConfig } from "#config/config.js";
import fetch from "node-fetch";
import { AzureProfile, buildThreatSeaAccessToken } from "#services/auth.service.js";
import { Logger } from "#logging/index.js";

interface DirectoryUser {
    "@odata.type": string;
    id: string;
    mail: string;
}
interface GraphResponse {
    value: DirectoryUser[];
}

const redirectUri = `${originConfig.backend}/auth/redirect`;
const ThreatSeaADGroupID = azureConfig.privilegedGroupId;

async function isUserMemberOfADThreatSeaGroup(accessToken: string, userId: string): Promise<number> {
    const bearer = "Bearer " + accessToken;
    const options = {
        method: "GET",
        headers: { Authorization: bearer },
    };
    const graphEndpoint = `https://graph.microsoft.com/v1.0/groups/${ThreatSeaADGroupID}/transitiveMembers`;

    return await fetch(graphEndpoint, options)
        .then((res) => res.json())
        .then((data) => {
            const user = (data as GraphResponse).value.find((user) => user.id === userId);
            if (user) {
                Logger.debug("User in Gruppe vorhanden");
                return 1;
            } else {
                Logger.debug("User nicht in Gruppe vorhanden");
                return 0;
            }
        })
        .catch((err) => {
            Logger.error("Error while determining privileges", err);
            return 0;
        });
}

const strategySelector = "azure";

const azureStrategy = new MicrosoftStrategy.Strategy(
    {
        clientID: azureConfig.clientId!,
        clientSecret: azureConfig.clientSecret!,
        callbackURL: redirectUri,
        scope: ["user.read", "GroupMember.Read.All"],
        tenant: azureConfig.tenantId!,
    },
    async function (accessToken: string, _refresh_token: string, _params: object[], profile: AzureProfile, done) {
        // called on successful sign in
        await isUserMemberOfADThreatSeaGroup(accessToken, profile.id)
            .then((isPrivileged) => buildThreatSeaAccessToken(profile, isPrivileged))
            .then((threatSeaToken) => {
                done(undefined, { threatSeaToken: threatSeaToken });
            }) // pass threatSeaToken in user object as passport is not setup for session management
            .catch((err) => {
                Logger.error("Error in preparing Token", err);
                done(err, false);
            });
    }
);

passport.use(strategySelector, azureStrategy);
