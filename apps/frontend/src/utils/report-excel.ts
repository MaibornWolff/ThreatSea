import type { ProjectReport } from "#api/types/project.types.ts";
import type { Tab } from "#utils/export.ts";

/**
 * Shapes a project report into the tab/column structure consumed by {@link exportAsExcelFile}.
 * Pure: it only maps the report data, so the row shaping can be tested without triggering a
 * download.
 */
export const buildReportExcelTabs = (reportData: ProjectReport): Tab[] => {
    const { threats, measures, assets, measureImpacts } = reportData;

    const finalThreats = threats
        .map((threat) => {
            const assetIds = threat.assets.map((asset) => asset.id).join(", ");
            const assetNames = threat.assets.map((asset) => asset.name ?? "").join(", ");
            if (threat.measures.length > 0) {
                const relevantMeasures = threat.measures.map((measure) => measure.measureId).join(", ");
                const relevantMeasureNames = threat.measures.map((measure) => measure.name ?? "").join(", ");
                return {
                    ...threat,
                    assetIds,
                    assetNames,
                    relevantMeasures,
                    relevantMeasureNames,
                };
            } else {
                return {
                    ...threat,
                    assetIds,
                    assetNames,
                    relevantMeasures: "",
                    relevantMeasureNames: "",
                };
            }
        })
        .sort((a, b) => a.id - b.id);

    const modifiedMeasures = measures.map((measure) => {
        const impactedThreatIds = measure.threats.map((threat) => threat.id).join(", ");
        const impactedThreatNames = measure.threats.map((threat) => threat.name ?? "").join(", ");

        return {
            ...measure,
            impactedThreatIds,
            impactedThreatNames,
            description: "description" in measure && measure.description ? measure.description : "",
        };
    });

    const modifiedMeasureImpacts = measureImpacts.map((measureImpact) => {
        return {
            ...measureImpact,
            damage: measureImpact.damage === null ? "no Impact" : measureImpact.damage,
            probability: measureImpact.probability === null ? "no Impact" : measureImpact.probability,
        };
    });

    return [
        {
            items: assets,
            name: "Assets",
            header: [
                { label: "ID", property: "id" },
                { label: "Name", property: "name" },
                { label: "Description", property: "description" },
                { label: "Confidentiality", property: "confidentiality" },
                { label: "Integrity", property: "integrity" },
                { label: "Availability", property: "availability" },
                { label: "Justification for Confidentiality", property: "confidentialityJustification" },
                { label: "Justification for Integrity", property: "integrityJustification" },
                { label: "Justification for Availability", property: "availabilityJustification" },
            ],
        },
        {
            items: finalThreats,
            name: "Threats",
            header: [
                { label: "ID", property: "id" },
                { label: "Name", property: "name" },
                { label: "Asset IDs", property: "assetIds" },
                { label: "Asset Names", property: "assetNames" },
                { label: "Component", property: "componentName" },
                { label: "Point of Attack", property: "pointOfAttack" },
                { label: "Attacker", property: "attacker" },
                { label: "Description", property: "description" },
                { label: "Confidentiality", property: "confidentiality" },
                { label: "Integrity", property: "integrity" },
                { label: "Availability", property: "availability" },
                { label: "Probability", property: "probability" },
                { label: "Damage", property: "damage" },
                { label: "Risk", property: "risk" },
                { label: "Net Probability", property: "netProbability" },
                { label: "Net Damage", property: "netDamage" },
                { label: "Net Risk", property: "netRisk" },
                { label: "Relevant Measures", property: "relevantMeasures" },
                { label: "Relevant Measure Names", property: "relevantMeasureNames" },
            ],
        },
        {
            items: modifiedMeasures,
            name: "Measures",
            header: [
                { label: "ID", property: "id" },
                { label: "Name", property: "name" },
                { label: "Description", property: "description" },
                { label: "ScheduledAt", property: "scheduledAt" },
                { label: "Impacted Threats IDs", property: "impactedThreatIds" },
                { label: "Impacted Threats Names", property: "impactedThreatNames" },
            ],
        },
        {
            items: modifiedMeasureImpacts,
            name: "Measure Impacts",
            header: [
                { label: "MeasureID", property: "measureId" },
                { label: "ThreatID", property: "threatId" },
                { label: "Description", property: "description" },
                { label: "Sets the threat out of scope", property: "setsOutOfScope" },
                { label: "Impacts the Probability of the Threat", property: "impactsProbability" },
                { label: "Impacts the Damage of the Threat", property: "impactsDamage" },
                { label: "Probability After", property: "probability" },
                { label: "Damage After", property: "damage" },
            ],
        },
    ];
};
