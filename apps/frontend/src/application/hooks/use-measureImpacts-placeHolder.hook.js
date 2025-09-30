import { useThreats } from "./use-threats.hook";
import { useEffect, useMemo, useState } from "react";

export const useMeasureImpactPlaceholder = ({ projectId }) => {
    const { items: threats, loadThreats } = useThreats({
        projectId,
    });

    useEffect(() => {
        loadThreats();
    }, [projectId, loadThreats]);

    const [currentThreatId, setCurrentThreatId] = useState(null);

    const damagePlaceholder = useMemo(() => {
        if (currentThreatId === null) {
            return null;
        }
        const { confidentiality, integrity, availability, assets } = threats.find((threat) => {
            return threat.id === currentThreatId;
        });
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
        return threats.find((threat) => {
            return threat.id === currentThreatId;
        }).probability;
    }, [currentThreatId, threats]);

    return {
        setCurrentThreatId,
        damagePlaceholder,
        probabilityPlaceholder,
    };
};
