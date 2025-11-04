import { useDialog } from "./use-dialog.hook";

export const useAssetDialog = () => {
    // Based upon the dialog hook.
    const { cancelDialog, confirmDialog } = useDialog("assets");

    return {
        cancelDialog,
        confirmDialog,
    };
};
