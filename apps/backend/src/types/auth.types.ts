export type PrivilegeCheckFn = (accessToken: string) => Promise<number>;
export interface GenericOidcUserProfile {
    sub?: string;
    id?: string;
    email?: string;
    mail?: string;
    userPrincipalName?: string;
    upn?: string;
    unique_name?: string;
    preferred_username?: string;
    displayName?: string;
    given_name?: string;
    givenName?: string;
    family_name?: string;
    surname?: string;
    emails?: { value: string }[] | string[];
    [key: string]: unknown;
}
export interface MicrosoftGraphMe {
    id: string;
    displayName?: string;
    mail?: string;
    userPrincipalName?: string;
    [key: string]: unknown;
}

export interface MicrosoftGraphGroupMembers {
    value: { id: string }[];
}
