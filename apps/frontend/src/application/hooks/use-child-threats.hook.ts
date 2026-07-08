import { useCallback, useState } from "react";
import { GenericThreatsAPI } from "#api/generic-threats.api.ts";
import type { ExtendedChildThreat } from "#api/types/child-threat.types.ts";

export const useChildThreats = ({ projectId }: { projectId: number }) => {
    const [items, setItems] = useState<ExtendedChildThreat[]>([]);
    const [isPending, setIsPending] = useState(false);

    const loadChildThreats = useCallback(async () => {
        setIsPending(true);
        try {
            const genericThreats = await GenericThreatsAPI.getGenericThreatsWithExtendedChildren({ projectId });
            const childThreats = genericThreats
                .flatMap((genericThreat) => genericThreat.children)
                .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

            setItems(childThreats);
        } finally {
            setIsPending(false);
        }
    }, [projectId]);

    return {
        items,
        isPending,
        loadChildThreats,
    };
};
