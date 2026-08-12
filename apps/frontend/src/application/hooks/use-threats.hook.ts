import { useCallback, useState } from "react";
import { GenericThreatsAPI } from "#api/generic-threats.api.ts";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import { ErrorActions } from "#application/actions/error.actions.ts";
import { toSerializedError } from "#utils/serialize-error.ts";
import { useAppDispatch } from "./use-app-redux.hook";

export const useThreats = ({ projectId }: { projectId: number }) => {
    const dispatch = useAppDispatch();
    const [items, setItems] = useState<ExtendedThreat[]>([]);
    const [isPending, setIsPending] = useState(false);

    const loadThreats = useCallback(async () => {
        setIsPending(true);
        try {
            const genericThreats = await GenericThreatsAPI.getGenericThreatsWithExtendedChildren({ projectId });
            const threats = genericThreats
                .flatMap((genericThreat) => genericThreat.children)
                .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

            setItems(threats);
        } catch (error) {
            // Surface through the global error state, like the redux thunks do
            // via the error middleware; keep any previously loaded items.
            dispatch(ErrorActions.setAPIError(toSerializedError(error)));
        } finally {
            setIsPending(false);
        }
    }, [projectId, dispatch]);

    return {
        items,
        isPending,
        loadThreats,
    };
};
