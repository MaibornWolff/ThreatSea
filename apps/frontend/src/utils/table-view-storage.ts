const TABLE_VIEW_STORAGE_PREFIX = "threatsea-table-view:";

/** Namespaces a table's view-setting key (column visibility, column widths) so logout can clear them all. */
export const tableViewStorageKey = (key: string) => `${TABLE_VIEW_STORAGE_PREFIX}${key}`;

/**
 * Removes every table view setting from sessionStorage. Logout does not reload
 * the page, so without this the next user in the same tab would inherit the
 * previous user's table layout.
 */
export const clearTableViewStorage = () => {
    const tableViewKeys = Object.keys(sessionStorage).filter((key) => key.startsWith(TABLE_VIEW_STORAGE_PREFIX));
    for (const key of tableViewKeys) {
        sessionStorage.removeItem(key);
    }
};
