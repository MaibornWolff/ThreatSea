/**
 * @module standard-component.types - Defines the basic
 *     components that the user can select in the system view.
 */

export enum STANDARD_COMPONENT_TYPES {
    USERS = "USERS",
    CLIENT = "CLIENT",
    SERVER = "SERVER",
    DATABASE = "DATABASE",
    COMMUNICATION_INFRASTRUCTURE = "COMMUNICATION_INFRASTRUCTURE",
}

export type StandardIcon = Exclude<STANDARD_COMPONENT_TYPES, STANDARD_COMPONENT_TYPES.COMMUNICATION_INFRASTRUCTURE>;
