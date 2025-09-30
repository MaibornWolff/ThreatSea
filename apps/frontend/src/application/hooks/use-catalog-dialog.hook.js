/**
 * @module use-catalog-dialog.hook - Custom hook
 *     for the catalogue dialog.
 */

import { useDialog } from "./use-dialog.hook";

/**
 * Creates a hook for the catalogue dialogs.
 * @returns Catalogue dialog hook.
 */
export const useCatalogDialog = () => {
    const {
        setValue,
        cancelDialog,
        confirmDialog,
        data: { name },
    } = useDialog("catalogs");

    /**
     * Changes the name of the catalogue.
     * @param {string} name - Name of the catalogue.
     */
    const setName = (name) => {
        setValue({ name });
    };

    return {
        setName,
        cancelDialog,
        confirmDialog,
        name,
    };
};
