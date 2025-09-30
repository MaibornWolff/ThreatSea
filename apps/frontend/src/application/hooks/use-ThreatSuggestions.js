import { useEffect, useMemo } from "react";
import { useThreats } from "./use-threats.hook";
import { useMeasureImpacts } from "./use-measureImpacts.hook";
import { useMeasures } from "./use-measures.hook";

export const useThreatSuggestions = ({ selectedMeasure, projectId }) => {
    const { items: threats, loadThreats } = useThreats({
        projectId,
    });
    const { items: measures, loadMeasures } = useMeasures({ projectId });
    const { items: measureImpacts, loadMeasureImpacts } = useMeasureImpacts({
        projectId,
    });

    const impactedThreats = useMemo(() => {
        return threats.filter((threat) => {
            return measureImpacts.some((measureImpact) => {
                return measureImpact.measureId === selectedMeasure.id && measureImpact.threatId === threat.id;
            });
        });
    }, [selectedMeasure, threats, measureImpacts]);

    //All Threats that have the same PointOfAttacks and Attackers
    const suggestedThreats = useMemo(() => {
        const matchingViaAttackPoints = threats.filter((threat) => {
            return (
                !impactedThreats.includes(threat) &&
                threats.some((otherThreat) => {
                    return (
                        otherThreat.attacker === threat.attacker &&
                        otherThreat.pointOfAttack === threat.pointOfAttack &&
                        measureImpacts.some((measureImpact) => {
                            return (
                                measureImpact.measureId === selectedMeasure.id &&
                                measureImpact.threatId === otherThreat.id
                            );
                        })
                    );
                })
            );
        });
        const matchingViaCatalogThreats = threats.filter((threat) => {
            return (
                !impactedThreats.includes(threat) &&
                threats.some((otherThreat) => {
                    otherThreat.catalogThreatId === threat.catalogThreatId &&
                        measureImpacts.some((measureImpact) => {
                            return (
                                measureImpact.measureId === selectedMeasure.id &&
                                measureImpact.threatId === otherThreat.id
                            );
                        });
                })
            );
        });
        return [...new Set([...matchingViaCatalogThreats, ...matchingViaAttackPoints])].sort((a, b) =>
            a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1
        );
    }, [selectedMeasure, threats, measureImpacts, impactedThreats]);

    const remainingThreats = useMemo(
        () =>
            threats
                .filter((threat) => {
                    return (
                        !impactedThreats.some((iThreat) => {
                            return iThreat.id === threat.id;
                        }) &&
                        !suggestedThreats.some((suggestedThreat) => {
                            return suggestedThreat.id === threat.id;
                        })
                    );
                })
                .sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1)),
        [suggestedThreats, impactedThreats, threats]
    );

    useEffect(() => {
        loadThreats();
    }, [projectId, loadThreats]);

    useEffect(() => {
        loadMeasureImpacts();
    }, [projectId, loadMeasureImpacts]);

    useEffect(() => {
        loadMeasures();
    }, [projectId, loadMeasures]);

    return {
        suggestedThreats,
        remainingThreats,
        impactedThreats,
    };
};
