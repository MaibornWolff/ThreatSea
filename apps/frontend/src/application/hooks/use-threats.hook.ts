import { useCallback, useRef, useState } from "react";
import { GenericThreatsAPI } from "#api/generic-threats.api.ts";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import { ErrorActions } from "#application/actions/error.actions.ts";
import { toSerializedError } from "#utils/serialize-error.ts";
import { useAppDispatch } from "./use-app-redux.hook";

export const useThreats = ({ projectId }: { projectId: number }) => {
    const dispatch = useAppDispatch();
    const [items, setItems] = useState<ExtendedThreat[]>([]);
    const [isPending, setIsPending] = useState(false);

    // Consumers refetch on autosave and navigation, so calls can overlap. Apply results only
    // for the latest call, so a slower older response can't overwrite newer data or clear
    // pending while a newer load runs (same pattern as use-generic-threats-list.hook).
    const loadSequenceRef = useRef(0);

    const loadThreats = useCallback(async () => {
        const sequence = ++loadSequenceRef.current;
        setIsPending(true);
        try {
            const genericThreats = await GenericThreatsAPI.getGenericThreatsWithExtendedChildren({ projectId });
            if (sequence !== loadSequenceRef.current) {
                return;
            }
            const threats = genericThreats
                .flatMap((genericThreat) => genericThreat.children)
                .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

            setItems(threats);
        } catch (error) {
            if (sequence !== loadSequenceRef.current) {
                return;
            }
            // Surface through the global error state, like the redux thunks do
            // via the error middleware; keep any previously loaded items.
            dispatch(ErrorActions.setAPIError(toSerializedError(error)));
        } finally {
            if (sequence === loadSequenceRef.current) {
                setIsPending(false);
            }
        }
    }, [projectId, dispatch]);

    return {
        items,
        isPending,
        loadThreats,
    };
};
