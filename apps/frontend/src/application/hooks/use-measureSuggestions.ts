import { useEffect, useMemo } from "react";
import type { Measure } from "#api/types/measure.types.ts";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import { useThreats } from "./use-threats.hook";
import { useCatalogMeasures } from "./use-catalog-measures.hook";
import { useMeasureImpacts } from "./use-measureImpacts.hook";
import { useMeasures } from "./use-measures.hook";
import type { CatalogMeasure } from "#api/types/catalog-measure.types.ts";

interface UseMeasureSuggestionsArgs {
    selectedThreat: ExtendedThreat;
    projectId: number;
    catalogId: number;
}

export const useMeasureSuggestions = ({ selectedThreat, projectId, catalogId }: UseMeasureSuggestionsArgs) => {
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

    const suggestedMeasures: Measure[] = useMemo(() => {
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

    const filteredCatalogMeasures: CatalogMeasure[] = useMemo(() => {
        return catalogMeasures.filter(
            (catalogMeasure) =>
                catalogMeasure.attacker === selectedThreat.attacker &&
                catalogMeasure.pointOfAttack === selectedThreat.pointOfAttack
        );
    }, [selectedThreat, catalogMeasures]);

    const remainingMeasures: Measure[] = useMemo(
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
