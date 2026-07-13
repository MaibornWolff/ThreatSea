import { useCallback, useState } from "react";
import { GenericThreatsAPI } from "#api/generic-threats.api.ts";
import type { ExtendedThreat } from "#api/types/threat.types.ts";

export const useThreats = ({ projectId }: { projectId: number }) => {
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
        } finally {
            setIsPending(false);
        }
    }, [projectId]);

    return {
        items,
        isPending,
        loadThreats,
    };
};
