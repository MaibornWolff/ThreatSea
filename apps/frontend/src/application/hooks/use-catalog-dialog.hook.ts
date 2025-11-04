import type { DialogValue } from "#application/reducers/dialogs.reducer.ts";
import { useDialog } from "./use-dialog.hook";

export const useCatalogDialog = () => {
    const { setValue, cancelDialog, confirmDialog, values } = useDialog("catalogs");

    const setName = (name: string) => {
        setValue({ name });
    };

    const { name = "" } = (values ?? {}) as DialogValue & {
        name?: string;
    };

    return {
        setName,
        cancelDialog,
        confirmDialog,
        name,
    };
};
