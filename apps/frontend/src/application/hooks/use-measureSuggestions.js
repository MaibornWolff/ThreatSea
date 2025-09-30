import { useEffect, useMemo } from "react";
import { useThreats } from "./use-threats.hook";
import { useCatalogMeasures } from "./use-catalog-measures.hook";
import { useMeasureImpacts } from "./use-measureImpacts.hook";
import { useMeasures } from "./use-measures.hook";

export const useMeasureSuggestions = ({ selectedThreat, projectId, catalogId }) => {
    const { items: threats, loadThreats } = useThreats({
        projectId,
    });
    const { items: measures, loadMeasures } = useMeasures({ projectId });
    const { items: catalogMeasures, loadCatalogMeasures } = useCatalogMeasures({
        catalogId,
    });
    const { items: measureImpacts, loadMeasureImpacts } = useMeasureImpacts({
        projectId,
    });

    const appliedMeasures = useMemo(
        () =>
            measures.filter((measure) => {
                return measureImpacts.some((measureImpact) => {
                    return measureImpact.measureId === measure.id && measureImpact.threatId === selectedThreat.id;
                });
            }),
        [selectedThreat, measures, measureImpacts]
    );

    const suggestedMeasures = useMemo(() => {
        const matchingViaAttackPoints = measures.filter((measure) => {
            return (
                !appliedMeasures.some((appMeasure) => {
                    return appMeasure.id === measure.id;
                }) &&
                measureImpacts.some((measureImpact) => {
                    return (
                        measureImpact.measureId === measure.id &&
                        threats.some((threat) => {
                            return (
                                measureImpact.threatId === threat.id &&
                                threat.attacker === selectedThreat.attacker &&
                                threat.pointOfAttack === selectedThreat.pointOfAttack
                            );
                        })
                    );
                })
            );
        });
        const matchingViaCatalogMeasure = measures.filter((measure) => {
            return catalogMeasures.some((catalogMeasure) => {
                return (
                    catalogMeasure.id === measure.catalogMeasureId &&
                    catalogMeasure.attacker === selectedThreat.attacker &&
                    catalogMeasure.pointOfAttack === selectedThreat.pointOfAttack
                );
            });
        });

        return [...new Set([...matchingViaCatalogMeasure, ...matchingViaAttackPoints])];
    }, [catalogMeasures, selectedThreat, threats, measures, measureImpacts, appliedMeasures]);

    const filteredCatalogMeasures = useMemo(
        () =>
            catalogMeasures.filter((catalogMeasure) => {
                return (
                    catalogMeasure.attacker === selectedThreat.attacker &&
                    catalogMeasure.pointOfAttack === selectedThreat.pointOfAttack
                );
            }),
        [selectedThreat, catalogMeasures]
    );

    const remainingMeasures = useMemo(
        () =>
            measures.filter((measure) => {
                return (
                    !appliedMeasures.some((appMeasure) => {
                        return appMeasure.id === measure.id;
                    }) &&
                    !suggestedMeasures.some((suggestedMeasure) => {
                        return suggestedMeasure.id === measure.id;
                    })
                );
            }),
        [measures, suggestedMeasures, appliedMeasures]
    );

    useEffect(() => {
        loadThreats();
    }, [projectId, loadThreats]);

    useEffect(() => {
        loadCatalogMeasures();
    }, [projectId, loadCatalogMeasures]);

    useEffect(() => {
        loadMeasureImpacts();
    }, [projectId, loadMeasureImpacts]);

    useEffect(() => {
        loadMeasures();
    }, [projectId, loadMeasures]);

    return {
        suggestedMeasures,
        appliedMeasures,
        filteredCatalogMeasures,
        remainingMeasures,
    };
};
