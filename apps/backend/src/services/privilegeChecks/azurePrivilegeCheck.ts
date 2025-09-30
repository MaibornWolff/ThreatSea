import fetch from "node-fetch";
import { MicrosoftGraphGroupMembers, MicrosoftGraphMe, PrivilegeCheckFn } from "#types/auth.types.js";
import { azureConfig } from "#config/config.js";
import console from "node:console";

const AD_GROUP_ID = azureConfig.privilegedGroupId;

export const azurePrivilegeCheck: PrivilegeCheckFn = async (accessToken) => {
    if (!accessToken) return 0;
    console.log(accessToken);
    const userRes = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: {
            Authorization: "Bearer " + accessToken,
        },
    });
    if (!userRes.ok) {
        console.error("Could not fetch user info from Graph. Code:", userRes.status);
        return 0;
    }
    const userProfile = (await userRes.json()) as MicrosoftGraphMe;
    const userId = userProfile.id;
    if (!userId) {
        console.error("No user id in /me result");
        return 0;
    }

    const membersRes = await fetch(
        `https://graph.microsoft.com/v1.0/groups/${AD_GROUP_ID}/transitiveMembers?$select=id`,
        {
            headers: { Authorization: "Bearer " + accessToken },
        }
    );

    if (!membersRes.ok) {
        console.error("Could not fetch group members. Code:", membersRes.status);
        return 0;
    }

    const data = (await membersRes.json()) as MicrosoftGraphGroupMembers;
    const isInGroup = !!(data.value && Array.isArray(data.value) && data.value.find((u) => u.id === userId));
    if (isInGroup) {
        console.log("User in Group");
    }
    return isInGroup ? 1 : 0;
};
