/**
 * @module user-roles.types - Defines the roles of the
 *     users that give access to certain functionalities like editing etc.
 */

export enum USER_ROLES {
    OWNER = "OWNER",
    EDITOR = "EDITOR",
    VIEWER = "VIEWER",
}

/**
 * Function to check if the user has the required role
 *
 * @param userRole - The role of the user.
 * @param requiredRole - The required role to check against.
 * @returns {boolean} True if the user has the required role, false otherwise.
 */
export function checkUserRole(userRole: USER_ROLES | undefined, requiredRole: USER_ROLES): boolean {
    switch (requiredRole) {
        case USER_ROLES.OWNER:
            return userRole === USER_ROLES.OWNER;
        case USER_ROLES.EDITOR:
            return userRole === USER_ROLES.OWNER || userRole === USER_ROLES.EDITOR;
        case USER_ROLES.VIEWER:
            return userRole === USER_ROLES.OWNER || userRole === USER_ROLES.EDITOR || userRole === USER_ROLES.VIEWER;
        default:
            return false;
    }
}
