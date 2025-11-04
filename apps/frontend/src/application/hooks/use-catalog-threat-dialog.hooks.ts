import type { DialogValue } from "#application/reducers/dialogs.reducer.ts";
import { useDialog } from "./use-dialog.hook.ts";

type CatalogThreatDialogValues = DialogValue & {
    name?: string;
    description?: string;
    confidentiality?: boolean;
    integrity?: boolean;
    availability?: boolean;
};

export const useCatalogThreatDialog = () => {
    const { setValue, cancelDialog, confirmDialog, values } = useDialog<CatalogThreatDialogValues | null>(
        "catalogThreats"
    );

    const { name, description, confidentiality, integrity, availability } = values ?? {};

    const setName = (name: string) => {
        setValue({ name });
    };

    const setDescription = (description: string) => {
        setValue({ description });
    };

    const setConfidentiality = (confidentiality: boolean) => {
        setValue({ confidentiality });
    };

    const setIntegrity = (integrity: boolean) => {
        setValue({ integrity });
    };

    const setAvailability = (availability: boolean) => {
        setValue({ availability });
    };

    return {
        setName,
        setDescription,
        setConfidentiality,
        setIntegrity,
        setAvailability,
        cancelDialog,
        confirmDialog,
        name,
        description,
        confidentiality,
        integrity,
        availability,
    };
};
