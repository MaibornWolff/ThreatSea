import { useEffect, useMemo, useState } from "react";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import { useThreats } from "./use-threats.hook";

export const useMeasureImpactPlaceholder = ({ projectId }: { projectId: number }) => {
    const { items: threats, loadThreats } = useThreats({
        projectId,
    });

    useEffect(() => {
        loadThreats();
    }, [projectId, loadThreats]);

    const [currentThreatId, setCurrentThreatId] = useState<number | null>(null);

    const damagePlaceholder = useMemo(() => {
        if (currentThreatId === null) {
            return null;
        }
        const threat = threats.find((candidate) => candidate.id === currentThreatId) as ExtendedThreat | undefined;

        if (!threat) {
            return null;
        }

        const { confidentiality, integrity, availability, assets } = threat;
        return assets.reduce((value, asset) => {
            if (confidentiality && value < asset.confidentiality) {
                value = asset.confidentiality;
            }
            if (integrity && value < asset.integrity) {
                value = asset.integrity;
            }
            if (availability && value < asset.availability) {
                value = asset.availability;
            }
            return value;
        }, 0); // default 0 if no protection goal is affected
    }, [currentThreatId, threats]);

    const probabilityPlaceholder = useMemo(() => {
        if (currentThreatId === null) {
            return null;
        }
        const threat = threats.find((candidate) => candidate.id === currentThreatId);
        return threat?.probability ?? null;
    }, [currentThreatId, threats]);

    return {
        setCurrentThreatId,
        damagePlaceholder,
        probabilityPlaceholder,
    };
};
