const TABLE_VIEW_STORAGE_PREFIX = "threatsea-table-view:";

// Every sessionStorage access can throw (a SecurityError when site data is blocked,
// a QuotaExceededError on write). Table view settings are a convenience, so a
// failing storage must degrade to "not persisted" instead of breaking the page.

/** Namespaces a table's view-setting key (column visibility, column widths) so logout can clear them all. */
export const tableViewStorageKey = (key: string) => `${TABLE_VIEW_STORAGE_PREFIX}${key}`;

/** The stored setting parsed from JSON, or undefined when absent, malformed or unreadable. */
export const readTableViewSetting = (key: string): unknown => {
    try {
        const stored = sessionStorage.getItem(tableViewStorageKey(key));
        return stored === null ? undefined : (JSON.parse(stored) as unknown);
    } catch {
        return undefined;
    }
};

export const writeTableViewSetting = (key: string, value: unknown) => {
    try {
        sessionStorage.setItem(tableViewStorageKey(key), JSON.stringify(value));
    } catch {
        // Not persisted; the in-memory setting still applies for this visit.
    }
};

/**
 * Removes every table view setting from sessionStorage. Logout does not reload
 * the page, so without this the next user in the same tab would inherit the
 * previous user's table layout.
 */
export const clearTableViewStorage = () => {
    try {
        const tableViewKeys = Object.keys(sessionStorage).filter((key) => key.startsWith(TABLE_VIEW_STORAGE_PREFIX));
        for (const key of tableViewKeys) {
            sessionStorage.removeItem(key);
        }
    } catch {
        // Nothing can have been persisted when storage is unavailable.
    }
};
