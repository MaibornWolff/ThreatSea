import { exportAsExcelFile } from "../../utils/export";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ProjectsAPI } from "../../api/projects.api";
import { calcRiskColour } from "../../utils/calcRisk";

const calcNetRiskMatrix = (threats, matrix, scheduledAt) => {
    if (!threats) return null;
    if (!matrix) return null;
    return threats.reduce(
        (arr, threat) => {
            const probability = threat.measures.reduce((min, measure) => {
                if (
                    measure.probability != null &&
                    min > measure.probability &&
                    new Date(measure.scheduledAt).getTime() <= scheduledAt.getTime()
                ) {
                    return measure.probability;
                }
                return min;
            }, threat.probability);
            const damage = threat.measures.reduce((min, measure) => {
                if (
                    measure.damage != null &&
                    min > measure.damage &&
                    new Date(measure.scheduledAt).getTime() <= scheduledAt.getTime()
                ) {
                    return measure.damage;
                }
                return min;
            }, threat.damage);
            const y = 5 - probability;
            const x = damage - 1;
            if (x >= 0 && y >= 0) {
                // if no protection goal is affected risk is not in the matrix
                if (typeof arr[y][x]?.amount !== "number") {
                    arr[y][x].amount = 0;
                }
                arr[y][x].amount++;
            }
            return arr;
        },
        [...matrix.map((row) => [...row].map((cell) => ({ ...cell })))]
    );
};

const calcRiskBarGraph = (matrix) => {
    if (!matrix) return null;
    return matrix.reduce(
        (obj, row) => {
            row.forEach((cell) => {
                const { color, amount } = cell;
                if (typeof amount === "number") {
                    obj[color] = obj[color] + amount;
                }
            });
            return obj;
        },
        { green: 0, yellow: 0, red: 0 }
    );
};

export const useReport = ({ projectId }) => {
    const {
        i18n: { language },
    } = useTranslation();
    const [data, setData] = useState(null);
    const [isChanged, setIsChanged] = useState(true);
    const [reportLanguage, setReportLanguage] = useState(language);
    const [sortDirection, setSortDirection] = useState("desc");
    const [sortBy, setSortBy] = useState("netRisk");
    const [showCoverPage, setShowCoverPage] = useState(true);
    const [showTableOfContentsPage, setShowTableOfContentsPage] = useState(true);
    const [showMethodExplanation, setShowMethodExplanation] = useState(true);
    const [showScaleExplanation, setShowScaleExplanation] = useState(true);
    const [showMatrixPage, setShowMatrixPage] = useState(true);
    const [showAssetsPage, setShowAssetsPage] = useState(true);
    const [showMeasuresPage, setShowMeasuresPage] = useState(true);
    const [showThreatListPage, setShowThreatListPage] = useState(true);
    const [showThreatsPage, setShowThreatsPage] = useState(true);
    const [fromScheduledAt, setFromScheduledAt] = useState(null);
    const [tillScheduledAt, setTillScheduledAt] = useState(null);
    const [riskMatrixMeasures, setRiskMatrixMeasures] = useState([]);
    const [systemImageOnSeperatePage, setSystemImageOnSeperatePage] = useState(false);

    const { threats, measures } = data || {};

    const fetchReport = useCallback(async () => {
        const data = await ProjectsAPI.getReport({
            projectId,
        });
        setData(data);
    }, [projectId]);

    const filename = useMemo(() => {
        if (data) {
            const { project } = data;
            return Date.now() + "_" + project.name;
        } else {
            return "filename";
        }
    }, [data]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const matrixDesign = useMemo(() => {
        if (typeof data?.project?.lineOfToleranceGreen !== "number") return null;
        if (typeof data?.project?.lineOfToleranceRed !== "number") return null;
        const lineOfToleranceGreen = data?.project?.lineOfToleranceGreen;
        const lineOfToleranceRed = data?.project?.lineOfToleranceRed;
        const matrix = [];
        for (let y = 0; y < 5; y++) {
            const row = [];
            for (let x = 0; x < 5; x++) {
                const color = calcRiskColour(x + 1, 5 - y, lineOfToleranceGreen, lineOfToleranceRed);
                row.push({
                    color,
                });
            }
            matrix.push(row);
        }
        return matrix;
    }, [data?.project?.lineOfToleranceGreen, data?.project?.lineOfToleranceRed]);

    const filteredThreats = useMemo(() => {
        if (!threats) return null;
        if (!fromScheduledAt && !tillScheduledAt) return threats;
        const from = fromScheduledAt ? new Date(fromScheduledAt) : null;
        const till = tillScheduledAt ? new Date(tillScheduledAt) : null;
        return threats.map((threat) => {
            return {
                ...threat,
                measures: threat.measures.filter((measure) => {
                    let result = true;
                    const scheduledAt = new Date(measure.scheduledAt).getTime();
                    if (from && from.getTime() > scheduledAt) {
                        result = false;
                    }
                    if (till && till.getTime() < scheduledAt) {
                        result = false;
                    }
                    return result;
                }),
            };
        });
    }, [threats, fromScheduledAt, tillScheduledAt]);

    const transformedThreats = useMemo(() => {
        if (!filteredThreats) return null;
        if (typeof data?.project?.lineOfToleranceGreen !== "number") return null;
        if (typeof data?.project?.lineOfToleranceRed !== "number") return null;
        const lineOfToleranceGreen = data?.project?.lineOfToleranceGreen;
        const lineOfToleranceRed = data?.project?.lineOfToleranceRed;
        return filteredThreats.map((threat) => {
            const { netProbability, netDamage } = threat;
            const bruttoColor = calcRiskColour(
                threat.damage,
                threat.probability,
                lineOfToleranceGreen,
                lineOfToleranceRed
            );
            const nettoColor = calcRiskColour(netDamage, netProbability, lineOfToleranceGreen, lineOfToleranceRed);
            return {
                ...threat,
                netProbability,
                netDamage,
                bruttoColor,
                nettoColor,
            };
        });
    }, [filteredThreats, data?.project?.lineOfToleranceGreen, data?.project?.lineOfToleranceRed]);

    const filteredMeasures = useMemo(() => {
        if (!measures) return null;
        if (!fromScheduledAt && !tillScheduledAt) return measures;
        const from = fromScheduledAt ? new Date(fromScheduledAt.substring(0, 10)) : null;
        const till = tillScheduledAt ? new Date(tillScheduledAt.substring(0, 10)) : null;
        return measures.filter((measure) => {
            let result = true;
            const scheduledAt = new Date(measure.scheduledAt.substring(0, 10)).getTime();
            if (from && from.getTime() > scheduledAt) {
                result = false;
            }
            if (till && till.getTime() < scheduledAt) {
                result = false;
            }
            return result;
        });
    }, [measures, fromScheduledAt, tillScheduledAt]);

    const bruttoMatrix = useMemo(() => {
        if (!transformedThreats) return null;
        if (!matrixDesign) return null;
        return transformedThreats.reduce(
            (arr, threat) => {
                const y = 5 - threat.probability;
                const x = threat.damage - 1;
                if (x >= 0 && y >= 0) {
                    // if no protection goal is affected risk is not in the matrix
                    if (typeof arr[y][x]?.amount !== "number") {
                        arr[y][x].amount = 0;
                    }
                    arr[y][x].amount++;
                }
                return arr;
            },
            [...matrixDesign.map((row) => [...row].map((cell) => ({ ...cell })))]
        );
    }, [transformedThreats, matrixDesign]);

    const nettoMatrix = useMemo(() => {
        if (!transformedThreats) return null;
        if (!matrixDesign) return null;
        return transformedThreats.reduce(
            (arr, threat) => {
                const { netProbability, netDamage } = threat;
                const y = 5 - netProbability;
                const x = netDamage - 1;
                if (x >= 0 && y >= 0) {
                    // if no protection goal is affected risk is not in the matrix
                    if (typeof arr[y][x]?.amount !== "number") {
                        arr[y][x].amount = 0;
                    }
                    arr[y][x].amount++;
                }
                return arr;
            },
            [...matrixDesign.map((row) => [...row].map((cell) => ({ ...cell })))]
        );
    }, [transformedThreats, matrixDesign]);

    const milestones = useMemo(() => {
        if (!filteredMeasures) return null;
        if (!filteredThreats) return null;
        if (!matrixDesign) return null;
        const map = filteredMeasures.reduce((obj, item) => {
            const scheduledAt = new Date(item.scheduledAt);
            const matrix = calcNetRiskMatrix(filteredThreats, matrixDesign, scheduledAt);
            const barGraph = calcRiskBarGraph(matrix);
            if (!obj[scheduledAt]) {
                obj[scheduledAt] = {};
                obj[scheduledAt].scheduledAt = scheduledAt;
                obj[scheduledAt].matrix = matrix;
                obj[scheduledAt].barGraph = barGraph;
                obj[scheduledAt].measures = [];
            }
            obj[scheduledAt].measures.push(item);
            return obj;
        }, {});
        return Object.values(map).sort((a, b) => (a.scheduledAt.getTime() < b.scheduledAt.getTime() ? -1 : 1));
    }, [filteredMeasures, filteredThreats, matrixDesign]);

    const transformedMilestones = useMemo(() => {
        if (!milestones) return null;
        return milestones.map((milestone) => {
            const { scheduledAt } = milestone;
            const id = scheduledAt.toISOString().substring(0, 10);
            return {
                ...milestone,
                active: riskMatrixMeasures.includes(id),
            };
        });
    }, [milestones, riskMatrixMeasures]);

    const sortedThreats = useMemo(() => {
        if (!transformedThreats) return null;
        return transformedThreats.sort((a, b) => {
            if (sortDirection === "asc") {
                return a[sortBy] < b[sortBy] ? -1 : 1;
            } else {
                return a[sortBy] > b[sortBy] ? -1 : 1;
            }
        });
    }, [transformedThreats, sortBy, sortDirection]);

    /**
     * Exports the threats, assets and measures as excel file.
     * Depends on Report Data
     * @event ExportIconButton#onClick
     */
    const fullExportAsExcel = (project, reportData) => {
        const { threats, measures, assets, measureImpacts } = reportData;

        const finalThreats = threats
            .map((threat) => {
                const assetIds = threat.assets.map((a) => a.id).join(", ");
                const assetNames = threat.assets.map((a) => a.name).join(", ");
                if (threat.measures.length > 0) {
                    const relevantMeasures = threat.measures.map((measure) => measure.measureId).join(", ");
                    const relevantMeasureNames = threat.measures.map((measure) => measure.name).join(", ");
                    return {
                        ...threat,
                        assetIds,
                        assetNames,
                        relevantMeasures: relevantMeasures,
                        relevantMeasureNames: relevantMeasureNames,
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
            .sort((a, b) => parseInt(a.id) > parseInt(b.id));

        const modifiedMeasures = measures.map((measure) => {
            const impactedThreatIds = measure.threats.map((threat) => threat.id).join(", ");
            const impactedThreatNames = measure.threats.map((threat) => threat.name).join(", ");

            return {
                ...measure,
                impactedThreatIds,
                impactedThreatNames,
                description: Object.hasOwn(measure, "description") ? measure.description : "",
            };
        });

        const modifiedMeasureImpacts = measureImpacts.map((measureImpact) => {
            return {
                ...measureImpact,
                damage: measureImpact.damage === null ? "no Impact" : measureImpact.damage,
                probability: measureImpact.probability === null ? "no Impact" : measureImpact.probability,
            };
        });

        const fileName = Date.now() + "_" + project.name + "-" + project.confidentialityLevel + "_export.xlsx";

        exportAsExcelFile(
            [
                {
                    items: assets,
                    name: "Assets",
                    header: [
                        {
                            label: "ID",
                            property: "id",
                        },
                        {
                            label: "Name",
                            property: "name",
                        },
                        {
                            label: "Description",
                            property: "description",
                        },
                        {
                            label: "Confidentiality",
                            property: "confidentiality",
                        },
                        {
                            label: "Integrity",
                            property: "integrity",
                        },
                        {
                            label: "Availability",
                            property: "availability",
                        },
                        {
                            label: "Justification for Confidentiality",
                            property: "confidentialityJustification",
                        },
                        {
                            label: "Justification for Integrity",
                            property: "integrityJustification",
                        },
                        {
                            label: "Justification for Availability",
                            property: "availabilityJustification",
                        },
                    ],
                },
                {
                    items: finalThreats,
                    name: "Threats",
                    header: [
                        {
                            label: "ID",
                            property: "id",
                        },
                        {
                            label: "Name",
                            property: "name",
                        },
                        {
                            label: "Asset IDs",
                            property: "assetIds",
                        },
                        {
                            label: "Asset Names",
                            property: "assetNames",
                        },
                        {
                            label: "Component",
                            property: "componentName",
                        },
                        {
                            label: "Point of Attack",
                            property: "pointOfAttack",
                        },
                        {
                            label: "Attacker",
                            property: "attacker",
                        },
                        {
                            label: "Description",
                            property: "description",
                        },
                        {
                            label: "Confidentiality",
                            property: "confidentiality",
                        },
                        {
                            label: "Integrity",
                            property: "integrity",
                        },
                        {
                            label: "Availability",
                            property: "availability",
                        },
                        {
                            label: "Probability",
                            property: "probability",
                        },
                        {
                            label: "Damage",
                            property: "damage",
                        },
                        {
                            label: "Risk",
                            property: "risk",
                        },
                        {
                            label: "Net Probability",
                            property: "netProbability",
                        },
                        {
                            label: "Net Damage",
                            property: "netDamage",
                        },
                        {
                            label: "Net Risk",
                            property: "netRisk",
                        },
                        {
                            label: "Relevant Measures",
                            property: "relevantMeasures",
                        },
                        {
                            label: "Relevant Measure Names",
                            property: "relevantMeasureNames",
                        },
                    ],
                },
                {
                    items: modifiedMeasures,
                    name: "Measures",
                    header: [
                        {
                            label: "ID",
                            property: "id",
                        },
                        {
                            label: "Name",
                            property: "name",
                        },
                        {
                            label: "Description",
                            property: "description",
                        },
                        {
                            label: "ScheduledAt",
                            property: "scheduledAt",
                        },
                        {
                            label: "Impacted Threats IDs",
                            property: "impactedThreatIds",
                        },
                        {
                            label: "Impacted Threats Names",
                            property: "impactedThreatNames",
                        },
                    ],
                },
                {
                    items: modifiedMeasureImpacts,
                    name: "Measure Impacts",
                    header: [
                        {
                            label: "MeasureID",
                            property: "measureId",
                        },
                        {
                            label: "ThreatID",
                            property: "threatId",
                        },
                        {
                            label: "Description",
                            property: "description",
                        },
                        {
                            label: "Sets the threat out of scope",
                            property: "setsOutOfScope",
                        },
                        {
                            label: "Impacts the Probability of the Threat",
                            property: "impactsProbability",
                        },
                        {
                            label: "Impacts the Damage of the Threat",
                            property: "impactsDamage",
                        },
                        {
                            label: "Probability After",
                            property: "probability",
                        },
                        {
                            label: "Damage After",
                            property: "damage",
                        },
                    ],
                },
            ],
            fileName
        );
    };

    return {
        riskMatrixMeasures,
        data,
        filename,
        bruttoMatrix,
        nettoMatrix,
        milestones: transformedMilestones,
        isChanged,
        fromScheduledAt,
        tillScheduledAt,
        sortDirection,
        sortBy,
        showCoverPage,
        showTableOfContentsPage,
        showMethodExplanation,
        showScaleExplanation,
        showMatrixPage,
        showAssetsPage,
        showMeasuresPage,
        showThreatListPage,
        showThreatsPage,
        systemImageOnSeperatePage,
        reportLanguage,
        measures: filteredMeasures,
        threats: sortedThreats,
        setRiskMatrixMeasures,
        setIsChanged,
        setFromScheduledAt,
        setTillScheduledAt,
        setSortDirection,
        setSortBy,
        setShowCoverPage,
        setShowTableOfContentsPage,
        setShowMethodExplanation,
        setShowScaleExplanation,
        setShowMatrixPage,
        setShowAssetsPage,
        setShowMeasuresPage,
        setShowThreatListPage,
        setShowThreatsPage,
        setSystemImageOnSeperatePage,
        setReportLanguage,
        fullExportAsExcel,
    };
};
