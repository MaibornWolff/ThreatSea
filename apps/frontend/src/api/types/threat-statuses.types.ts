/**
 * @module threat-statuses.types Defines status values for child threats.
 * Mirrors the backend enum in apps/backend/src/types/threat-statuses.types.ts.
 */

export enum THREAT_STATUSES {
    NEW = "new",
    IN_PROGRESS = "in progress",
    FINALIZED = "finalized",
    OUTOFSCOPE = "out of scope",
}
