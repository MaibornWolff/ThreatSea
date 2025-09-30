import { GenericOidcUserProfile } from "#types/auth.types.js";
import { Profile } from "passport-openidconnect";

/**
 * Merges two OIDC profile sources (sub and profile) to a robust, generic object.
 * - If sub is a string (as per OIDC standard), it becomes { sub }.
 * - If sub is an object (Non-standard, often Azure!), its fields are merged in.
 * - profile fields take precedence over sub in case of conflict.
 *
 * This ensures you have all potential profile data in one object for mapping.
 */
/**
 * Merges OIDC sub/profile into a single object. Adds Getters for fields with fallbacks.
 */
export function mergeOidcProfile(
    sub: string | Record<string, unknown>,
    profile: Profile
): GenericOidcUserProfile & {
    getEmail(): string;
    getName(): string;
    getFirstname(): string;
    getLastname(): string;
    getDisplayName(): string;
    getId(): string;
} {
    const subObj = typeof sub === "object" && sub !== null ? sub : { sub };
    const merged: Record<string, unknown> = { ...subObj, ...(profile || {}) };

    function pick(keys: string[]): string {
        for (const key of keys) {
            const value = merged[key];
            if (key === "emails" && Array.isArray(value)) {
                const arr = value;
                if (
                    typeof arr[0] === "object" &&
                    arr[0] !== null &&
                    "value" in arr[0] &&
                    typeof (arr[0] as { value: unknown }).value === "string"
                ) {
                    return (arr[0] as { value: string }).value;
                }
                if (typeof arr[0] === "string") return arr[0] as string;
            }
            if (typeof value === "string" && value) return value;
        }
        return "";
    }

    return Object.assign(merged, {
        getEmail: () =>
            pick(["email", "mail", "userPrincipalName", "preferred_username", "unique_name", "upn", "emails"]),
        getName: () => pick(["name", "displayName", "fullname", "given_name", "givenName", "firstname", "firstName"]),
        getFirstname: () => pick(["givenName", "given_name", "firstname", "firstName", "name", "displayName"]),
        getLastname: () => pick(["family_name", "surname", "lastname", "lastName", "displayName", "name"]),
        getDisplayName: () => pick(["displayName"]),
        getId: () => pick(["oid", "objectId", "id", "sub"]),
    });
}
