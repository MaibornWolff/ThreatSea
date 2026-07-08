import { useEffect, useMemo, useState } from "react";
import { useChildThreats } from "./use-child-threats.hook";

export const useMeasureImpactPlaceholder = ({ projectId }: { projectId: number }) => {
    const { items: childThreats, loadChildThreats } = useChildThreats({
        projectId,
    });

    useEffect(() => {
        loadChildThreats();
    }, [projectId, loadChildThreats]);

    const [currentChildThreatId, setCurrentChildThreatId] = useState<number | null>(null);

    const damagePlaceholder = useMemo(() => {
        if (currentChildThreatId === null) {
            return null;
        }
        const childThreat = childThreats.find((candidate) => candidate.id === currentChildThreatId);

        if (!childThreat) {
            return null;
        }

        const { confidentiality, integrity, availability } = childThreat;
        return childThreat.assets.reduce((value, asset) => {
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
    }, [currentChildThreatId, childThreats]);

    const probabilityPlaceholder = useMemo(() => {
        if (currentChildThreatId === null) {
            return null;
        }
        const childThreat = childThreats.find((candidate) => candidate.id === currentChildThreatId);
        return childThreat?.probability ?? null;
    }, [currentChildThreatId, childThreats]);

    return {
        setCurrentChildThreatId,
        damagePlaceholder,
        probabilityPlaceholder,
    };
};
