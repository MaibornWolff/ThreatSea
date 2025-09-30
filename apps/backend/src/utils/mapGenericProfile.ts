import { GenericOidcUserProfile } from "#types/auth.types.js";

function pick(keys: string[], obj: Record<string, unknown>): string {
    for (const key of keys) {
        const value = obj[key];
        if (key === "emails" && Array.isArray(value)) {
            const arr = value;
            if (typeof arr[0] === "object" && arr[0] !== null && "value" in arr[0]) {
                return (arr[0] as { value: string }).value;
            }
            if (typeof arr[0] === "string") return arr[0];
        }
        if (typeof value === "string" && value) return value;
    }
    return "";
}

export function mapGenericProfile(profile: GenericOidcUserProfile): {
    email: string;
    firstname: string;
    lastname: string;
    displayName: string;
    providerId: string;
} {
    return {
        email: pick(
            ["email", "mail", "userPrincipalName", "upn", "unique_name", "preferred_username", "emails"],
            profile
        ),
        firstname: pick(["given_name", "givenName", "firstname", "firstName", "name"], profile),
        lastname: pick(["family_name", "surname", "lastname", "lastName", "displayName", "name"], profile),
        displayName: pick(["displayName"], profile),
        providerId: pick(["oid", "id", "sub"], profile),
    };
}
