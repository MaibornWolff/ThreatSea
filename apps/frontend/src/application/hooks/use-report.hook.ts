import type { ProjectReport } from "#api/types/project.types.ts";
import type { SortDirection } from "#application/actions/list.actions.ts";
import { exportAsExcelFile } from "../../utils/export";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ProjectsAPI } from "../../api/projects.api";
import { calcRiskColour } from "../../utils/calcRisk";
import type { MatrixColorKey } from "#view/colors/matrix.ts";

type ReportThreat = ProjectReport["threats"][number];
type ReportMeasure = ProjectReport["measures"][number];
export interface RiskMatrixCell {
    color: MatrixColorKey;
    amount?: number;
}
export type RiskMatrix = RiskMatrixCell[][];
interface RiskBarGraph {
    green: number;
    yellow: number;
    red: number;
}

export interface Milestone {
    scheduledAt: Date;
    matrix: RiskMatrix | null;
    barGraph: RiskBarGraph | null;
    measures?: ReportMeasure[];
    active?: boolean;
}

const calcNetRiskMatrix = (
    threats: ReportThreat[] | null | undefined,
    matrix: RiskMatrix | null,
    scheduledAt: Date
): RiskMatrix | null => {
    if (!threats) return null;
    if (!matrix) return null;
    return threats.reduce(
        (arr, threat) => {
            const probability = threat.measures.reduce((min, measure) => {
                if (measure.probability == null) {
                    return min;
                }
                const measureScheduledAt = measure.scheduledAt ? new Date(measure.scheduledAt) : null;
                if (
                    measureScheduledAt &&
                    !Number.isNaN(measureScheduledAt.getTime()) &&
                    min > measure.probability &&
                    measureScheduledAt.getTime() <= scheduledAt.getTime()
                ) {
                    return measure.probability;
                }
                return min;
            }, threat.probability);
            const damage = threat.measures.reduce((min, measure) => {
                if (measure.damage == null) {
                    return min;
                }
                const measureScheduledAt = measure.scheduledAt ? new Date(measure.scheduledAt) : null;
                if (
                    measureScheduledAt &&
                    !Number.isNaN(measureScheduledAt.getTime()) &&
                    min > measure.damage &&
                    measureScheduledAt.getTime() <= scheduledAt.getTime()
                ) {
                    return measure.damage;
                }
                return min;
            }, threat.damage);
            const y = 5 - probability;
            const x = damage - 1;
            if (x >= 0 && y >= 0 && arr[y]?.[x]) {
                // if no protection goal is affected risk is not in the matrix
                if (typeof arr[y][x].amount !== "number") {
                    arr[y][x].amount = 0;
                }
                arr[y][x].amount++;
            }
            return arr;
        },
        [...matrix.map((row) => [...row].map((cell) => ({ ...cell })))]
    );
};

const calcRiskBarGraph = (matrix: RiskMatrix | null): RiskBarGraph | null => {
    if (!matrix) return null;
    return matrix.reduce(
        (summary, row) => {
            row.forEach((cell) => {
                const { color, amount } = cell;
                if (typeof amount === "number" && (color === "green" || color === "yellow" || color === "red")) {
                    summary[color] += amount;
                }
            });
            return summary;
        },
        { green: 0, yellow: 0, red: 0 } as RiskBarGraph
    );
};

export const useReport = ({ projectId }: { projectId: number }) => {
    const {
        i18n: { language },
    } = useTranslation();
    const [data, setData] = useState<ProjectReport | null>(null);
    const [isChanged, setIsChanged] = useState<boolean>(true);
    const [reportLanguage, setReportLanguage] = useState(language);
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
    const [sortBy, setSortBy] = useState<string>("netRisk");
    const [showCoverPage, setShowCoverPage] = useState<boolean>(true);
    const [showTableOfContentsPage, setShowTableOfContentsPage] = useState<boolean>(true);
    const [showMethodExplanation, setShowMethodExplanation] = useState<boolean>(true);
    const [showScaleExplanation, setShowScaleExplanation] = useState<boolean>(true);
    const [showMatrixPage, setShowMatrixPage] = useState<boolean>(true);
    const [showAssetsPage, setShowAssetsPage] = useState<boolean>(true);
    const [showMeasuresPage, setShowMeasuresPage] = useState<boolean>(true);
    const [showThreatListPage, setShowThreatListPage] = useState<boolean>(true);
    const [showThreatsPage, setShowThreatsPage] = useState<boolean>(true);
    const [fromScheduledAt, setFromScheduledAt] = useState<string | null>(null);
    const [tillScheduledAt, setTillScheduledAt] = useState<string | null>(null);
    const [riskMatrixMeasures, setRiskMatrixMeasures] = useState<string[]>([]);
    const [systemImageOnSeperatePage, setSystemImageOnSeperatePage] = useState<boolean>(false);

    const threats = data?.threats;
    const measures = data?.measures;

    const fetchReport = useCallback(async () => {
        const report = await ProjectsAPI.getReport({
            projectId,
        });
        setData(report);
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

    const matrixDesign: RiskMatrix | null = useMemo(() => {
        if (typeof data?.project?.lineOfToleranceGreen !== "number") return null;
        if (typeof data?.project?.lineOfToleranceRed !== "number") return null;
        const lineOfToleranceGreen = data?.project?.lineOfToleranceGreen;
        const lineOfToleranceRed = data?.project?.lineOfToleranceRed;
        const matrix: RiskMatrix = [];
        for (let y = 0; y < 5; y++) {
            const row: RiskMatrixCell[] = [];
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

    const filteredThreats: ReportThreat[] | null = useMemo(() => {
        if (!threats) return null;
        if (!fromScheduledAt && !tillScheduledAt) return threats;
        const from = fromScheduledAt ? new Date(fromScheduledAt) : null;
        const till = tillScheduledAt ? new Date(tillScheduledAt) : null;
        return threats.map((threat) => {
            return {
                ...threat,
                measures: threat.measures.filter((measure) => {
                    let result = true;
                    const scheduledAt = measure.scheduledAt ? new Date(measure.scheduledAt) : null;
                    const scheduledAtTime = scheduledAt?.getTime() ?? Number.NaN;
                    if (from && from.getTime() > scheduledAtTime) {
                        result = false;
                    }
                    if (till && till.getTime() < scheduledAtTime) {
                        result = false;
                    }
                    return result;
                }),
            };
        });
    }, [threats, fromScheduledAt, tillScheduledAt]);

    const transformedThreats: (ReportThreat & { bruttoColor: string; nettoColor: string })[] | null = useMemo(() => {
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

    const filteredMeasures: ReportMeasure[] | null = useMemo(() => {
        if (!measures) return null;
        if (!fromScheduledAt && !tillScheduledAt) return measures;
        const from = fromScheduledAt ? new Date(fromScheduledAt.substring(0, 10)) : null;
        const till = tillScheduledAt ? new Date(tillScheduledAt.substring(0, 10)) : null;
        return measures.filter((measure) => {
            let result = true;
            const scheduledAt = measure.scheduledAt
                ? new Date(measure.scheduledAt.toString().substring(0, 10)).getTime()
                : NaN;
            if (from && from.getTime() > scheduledAt) {
                result = false;
            }
            if (till && till.getTime() < scheduledAt) {
                result = false;
            }
            return result;
        });
    }, [measures, fromScheduledAt, tillScheduledAt]);

    const bruttoMatrix: RiskMatrix | null = useMemo(() => {
        if (!transformedThreats) return null;
        if (!matrixDesign) return null;
        return transformedThreats.reduce(
            (arr, threat) => {
                const y = 5 - threat.probability;
                const x = threat.damage - 1;
                if (x >= 0 && y >= 0 && arr[y]?.[x]) {
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

    const nettoMatrix: RiskMatrix | null = useMemo(() => {
        if (!transformedThreats) return null;
        if (!matrixDesign) return null;
        return transformedThreats.reduce(
            (arr, threat) => {
                const { netProbability, netDamage } = threat;
                const y = 5 - netProbability;
                const x = netDamage - 1;
                if (x >= 0 && y >= 0 && arr[y]?.[x]) {
                    // if no protection goal is affected risk is not in the matrix
                    if (typeof arr[y][x].amount !== "number") {
                        arr[y][x].amount = 0;
                    }
                    arr[y][x].amount++;
                }
                return arr;
            },
            [...matrixDesign.map((row) => [...row].map((cell) => ({ ...cell })))]
        );
    }, [transformedThreats, matrixDesign]);

    const milestones: Milestone[] | null = useMemo(() => {
        if (!filteredMeasures) return null;
        if (!filteredThreats) return null;
        if (!matrixDesign) return null;
        const map: Record<number, Milestone> = filteredMeasures.reduce(
            (obj, item) => {
                if (!item.scheduledAt) {
                    return obj;
                }
                const scheduledAt = new Date(item.scheduledAt);
                const scheduledAtTime = scheduledAt.getTime();
                if (Number.isNaN(scheduledAtTime)) {
                    return obj;
                }
                const matrix = calcNetRiskMatrix(filteredThreats, matrixDesign, scheduledAt);
                const barGraph = calcRiskBarGraph(matrix);

                if (!obj[scheduledAtTime]) {
                    obj[scheduledAtTime] = {
                        scheduledAt,
                        matrix,
                        barGraph,
                        measures: [],
                    };
                }
                obj[scheduledAtTime].measures?.push(item);
                return obj;
            },
            {} as Record<number, Milestone>
        );
        return Object.values(map).sort((a, b) => (a.scheduledAt.getTime() < b.scheduledAt.getTime() ? -1 : 1));
    }, [filteredMeasures, filteredThreats, matrixDesign]);

    const transformedMilestones: Milestone[] | null = useMemo(() => {
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

    const sortedThreats: typeof transformedThreats = useMemo(() => {
        if (!transformedThreats) return null;

        const threatsSortedBy = sortBy as keyof (typeof transformedThreats)[number];
        const threatsCopy: typeof transformedThreats = JSON.parse(JSON.stringify(transformedThreats));
        threatsCopy.sort((a, b) => {
            if (sortDirection === "asc") {
                return (a[threatsSortedBy] ?? "") < (b[threatsSortedBy] ?? "") ? -1 : 1;
            } else {
                return (a[threatsSortedBy] ?? "") > (b[threatsSortedBy] ?? "") ? -1 : 1;
            }
        });
        return threatsCopy;
    }, [transformedThreats, sortBy, sortDirection]);

    const fullExportAsExcel = (
        project: { name: string; confidentialityLevel: unknown },
        reportData: ProjectReport | null
    ) => {
        if (!reportData) {
            return;
        }

        const { threats, measures, assets, measureImpacts } = reportData;

        const finalThreats = threats
            .map((threat) => {
                const assetIds = threat.assets.map((a) => a.id).join(", ");
                const assetNames = threat.assets.map((a) => a.name ?? "").join(", ");
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

        const fileName =
            Date.now() +
            "_" +
            project.name +
            "-" +
            String(project.confidentialityLevel ?? "").toUpperCase() +
            "_export.xlsx";

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
