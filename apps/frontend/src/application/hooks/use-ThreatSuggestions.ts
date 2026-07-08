import { useEffect, useMemo } from "react";
import type { Measure } from "#api/types/measure.types.ts";
import type { ExtendedChildThreat } from "#api/types/child-threat.types.ts";
import { useChildThreats } from "./use-child-threats.hook";
import { useMeasureImpacts } from "./use-measureImpacts.hook";
import { useMeasures } from "./use-measures.hook";

export const useThreatSuggestions = ({
    selectedMeasure,
    projectId,
}: {
    selectedMeasure: Measure;
    projectId: number;
}) => {
    const { items: childThreats, loadChildThreats } = useChildThreats({
        projectId,
    });
    const { loadMeasures } = useMeasures({ projectId });
    const { items: measureImpacts, loadMeasureImpacts } = useMeasureImpacts({
        projectId,
    });

    const impactedThreats: ExtendedChildThreat[] = useMemo(() => {
        return childThreats.filter((threat) => {
            return measureImpacts.some((measureImpact) => {
                return measureImpact.measureId === selectedMeasure.id && measureImpact.childThreatId === threat.id;
            });
        });
    }, [selectedMeasure, childThreats, measureImpacts]);

    //All Threats that have the same PointOfAttacks and Attackers
    const suggestedThreats: ExtendedChildThreat[] = useMemo(() => {
        const matchingViaAttackPoints = childThreats.filter((threat) => {
            return (
                !impactedThreats.includes(threat) &&
                childThreats.some((otherThreat) => {
                    return (
                        otherThreat.attacker === threat.attacker &&
                        otherThreat.pointOfAttack === threat.pointOfAttack &&
                        measureImpacts.some((measureImpact) => {
                            return (
                                measureImpact.measureId === selectedMeasure.id &&
                                measureImpact.childThreatId === otherThreat.id
                            );
                        })
                    );
                })
            );
        });
        const matchingViaGenericThreats = childThreats.filter((threat) => {
            return (
                !impactedThreats.includes(threat) &&
                childThreats.some(
                    (otherThreat) =>
                        otherThreat.genericThreatId === threat.genericThreatId &&
                        measureImpacts.some(
                            (measureImpact) =>
                                measureImpact.measureId === selectedMeasure.id &&
                                measureImpact.childThreatId === otherThreat.id
                        )
                )
            );
        });
        return [...new Set([...matchingViaGenericThreats, ...matchingViaAttackPoints])].sort((a, b) =>
            a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1
        );
    }, [selectedMeasure, childThreats, measureImpacts, impactedThreats]);

    const remainingThreats: ExtendedChildThreat[] = useMemo(
        () =>
            childThreats
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
        [suggestedThreats, impactedThreats, childThreats]
    );

    useEffect(() => {
        loadChildThreats();
    }, [projectId, loadChildThreats]);

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
