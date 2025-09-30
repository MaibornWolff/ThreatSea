/**
 * @module use-asset-dialog.hook - Custom hook
 *     for the asset dialog.
 */

import { useDialog } from "./use-dialog.hook";

/**
 * Creates a custom hook component for the asset dialogs.
 * @returns Custom asset dialog hook.
 */
export const useMemberDialog = () => {
    // Based upon the dialog hook.
    const { cancelDialog, confirmDialog } = useDialog("member");

    return {
        cancelDialog,
        confirmDialog,
    };
};
