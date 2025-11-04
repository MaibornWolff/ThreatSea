import { useDialog } from "./use-dialog.hook.ts";

export const useMemberDialog = () => {
    const { cancelDialog, confirmDialog } = useDialog("member");

    return {
        cancelDialog,
        confirmDialog,
    };
};
