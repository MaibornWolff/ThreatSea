/**
 * Attacker filter data-testid suffixes used on the catalog page.
 */
export const ATTACKER_FILTER_TEST_IDS = {
    UNAUTHORISED_PARTIES: "catalog-page_filter-by-un-par",
    SYSTEM_USERS: "catalog-page_filter-by-sys-us",
    APPLICATION_USERS: "catalog-page_filter-by-app-us",
    ADMINISTRATORS: "catalog-page_filter-by-adm-us",
} as const;

/**
 * Attacker selection data-testid pattern used in catalog threat/measure creation modals.
 * Replace * with "threat" or "measure".
 */
export const ATTACKER_SELECTION_TEST_IDS = {
    UNAUTHORISED_PARTIES: "catalog-*-creation-modal_attacker-selection_un-par",
    SYSTEM_USERS: "catalog-*-creation-modal_attacker-selection_sys-us",
    APPLICATION_USERS: "catalog-*-creation-modal_attacker-selection_app-us",
    ADMINISTRATORS: "catalog-*-creation-modal_attacker-selection_adm-us",
} as const;

/**
 * Human-readable attacker names.
 */
export const ATTACKER_LABELS = {
    UNAUTHORISED_PARTIES: "Unauthorised Parties",
    SYSTEM_USERS: "System Users",
    APPLICATION_USERS: "Application Users",
    ADMINISTRATORS: "Administrators",
} as const;

/**
 * Points of attack filter data-testid suffixes used on the catalog page.
 */
export const POA_FILTER_TEST_IDS = {
    DATA_STORAGE_INFRASTRUCTURE: "catalog-page_filter-by-da-sto-infra",
    PROCESSING_INFRASTRUCTURE: "catalog-page_filter-by-pro-infra",
    COMMUNICATION_INFRASTRUCTURE: "catalog-page_filter-by-com-infra",
    COMMUNICATION_INTERFACES: "catalog-page_filter-by-com-inter",
    USER_INTERFACE: "catalog-page_filter-by-us-inter",
    USER_BEHAVIOUR: "catalog-page_filter-by-us-beh",
} as const;

/**
 * POA selection data-testid pattern used in catalog threat/measure creation modals.
 * Replace * with "threat" or "measure".
 */
export const POA_SELECTION_TEST_IDS = {
    DATA_STORAGE_INFRASTRUCTURE: "catalog-*-creation-modal_PoA-selection_da-sto-infra",
    PROCESSING_INFRASTRUCTURE: "catalog-*-creation-modal_PoA-selection_pro-infra",
    COMMUNICATION_INFRASTRUCTURE: "catalog-*-creation-modal_PoA-selection_com-infra",
    COMMUNICATION_INTERFACES: "catalog-*-creation-modal_PoA-selection_com-inter",
    USER_INTERFACE: "catalog-*-creation-modal_PoA-selection_us-inter",
    USER_BEHAVIOUR: "catalog-*-creation-modal_PoA-selection_us-beh",
} as const;

/**
 * Human-readable POA names.
 */
export const POA_LABELS = {
    DATA_STORAGE_INFRASTRUCTURE: "Data Storage Infrastructure",
    PROCESSING_INFRASTRUCTURE: "Processing Infrastructure",
    COMMUNICATION_INFRASTRUCTURE: "Communication Infrastructure",
    COMMUNICATION_INTERFACES: "Communication Interfaces",
    USER_INTERFACE: "User Interface",
    USER_BEHAVIOUR: "User Behaviour",
} as const;

