import type { ProjectReport } from "#api/types/project.types.ts";
import type { SortDirection } from "#application/actions/list.actions.ts";
import { exportAsExcelFile } from "#utils/export.ts";
import { toDayNumber, createRiskMatrixDesign, addThreatsToRiskMatrix } from "#utils/riskMatrix.ts";
import { useAlert } from "#application/hooks/use-alert.hook.ts";
import { useState, useMemo, useEffect, useEffectEvent, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ProjectsAPI } from "#api/projects.api.ts";
import { calcRiskColour, calcNetRisk } from "#utils/calcRisk.ts";
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

const calcActiveMeasureNetRisk = (threat: ReportThreat, scheduledAt: Date) => {
    const activeMeasures = threat.measures.filter((measure) => {
        if (!measure.scheduledAt) {
            return false;
        }
        const measureScheduledAt = toDayNumber(new Date(measure.scheduledAt));
        return !Number.isNaN(measureScheduledAt) && measureScheduledAt <= toDayNumber(scheduledAt);
    });
    return calcNetRisk(threat.probability, threat.damage, activeMeasures);
};

const calcNetRiskMatrix = (
    threats: ReportThreat[] | null | undefined,
    matrix: RiskMatrix | null,
    scheduledAt: Date
): RiskMatrix | null => {
    if (!threats || !matrix) {
        return null;
    }
    return addThreatsToRiskMatrix(matrix, threats, (threat) => {
        const { netProbability, netDamage } = calcActiveMeasureNetRisk(threat, scheduledAt);
        return { probability: netProbability, damage: netDamage };
    });
};

const calcRiskBarGraph = (matrix: RiskMatrix | null): RiskBarGraph | null => {
    if (!matrix) {
        return null;
    }
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
        t,
        i18n: { language },
    } = useTranslation();
    const { showErrorMessage } = useAlert();
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
    const [showComponentsPage, setShowComponentsPage] = useState<boolean>(true);
    const [showAssetsPage, setShowAssetsPage] = useState<boolean>(true);
    const [showMeasuresPage, setShowMeasuresPage] = useState<boolean>(true);
    const [showThreatListPage, setShowThreatListPage] = useState<boolean>(true);
    const [showThreatsPage, setShowThreatsPage] = useState<boolean>(true);
    const [fromScheduledAt, setFromScheduledAt] = useState<string | null>(null);
    const [tillScheduledAt, setTillScheduledAt] = useState<string | null>(null);
    const [riskMatrixMeasures, setRiskMatrixMeasures] = useState<string[]>([]);
    const [systemImageOnSeparatePage, setSystemImageOnSeparatePage] = useState<boolean>(false);

    const threats = data?.threats;
    const measures = data?.measures;

    const isFetchingRef = useRef(false);

    const fetchReport = useEffectEvent(async () => {
        if (isFetchingRef.current) {
            return;
        }
        isFetchingRef.current = true;
        try {
            const report = await ProjectsAPI.getReport({ projectId });
            setData(report);
        } finally {
            isFetchingRef.current = false;
        }
    });

    const filename = useMemo(() => {
        if (data) {
            const { project } = data;
            return new Date().getTime() + "_" + project.name;
        } else {
            return "filename";
        }
    }, [data]);

    useEffect(() => {
        fetchReport();
    }, []);

    const matrixDesign: RiskMatrix | null = useMemo(() => {
        if (typeof data?.project?.lineOfToleranceGreen !== "number") {
            return null;
        }
        if (typeof data?.project?.lineOfToleranceRed !== "number") {
            return null;
        }
        return createRiskMatrixDesign(data.project.lineOfToleranceGreen, data.project.lineOfToleranceRed);
    }, [data?.project?.lineOfToleranceGreen, data?.project?.lineOfToleranceRed]);

    const filteredThreats: ReportThreat[] | null = useMemo(() => {
        if (!threats) {
            return null;
        }
        if (!fromScheduledAt && !tillScheduledAt) {
            return threats;
        }
        const from = fromScheduledAt ? new Date(fromScheduledAt) : null;
        const till = tillScheduledAt ? new Date(tillScheduledAt) : null;
        return threats.map((threat) => {
            return {
                ...threat,
                measures: threat.measures.filter((measure) => {
                    let result = true;
                    const scheduledAtTime = measure.scheduledAt ? toDayNumber(new Date(measure.scheduledAt)) : NaN;
                    if (from && toDayNumber(from) > scheduledAtTime) {
                        result = false;
                    }
                    if (till && toDayNumber(till) < scheduledAtTime) {
                        result = false;
                    }
                    return result;
                }),
            };
        });
    }, [threats, fromScheduledAt, tillScheduledAt]);

    const transformedThreats: (ReportThreat & { bruttoColor: string; nettoColor: string })[] | null = useMemo(() => {
        if (!filteredThreats) {
            return null;
        }
        if (typeof data?.project?.lineOfToleranceGreen !== "number") {
            return null;
        }
        if (typeof data?.project?.lineOfToleranceRed !== "number") {
            return null;
        }
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
        if (!measures) {
            return null;
        }
        if (!fromScheduledAt && !tillScheduledAt) {
            return measures;
        }
        const from = fromScheduledAt ? toDayNumber(new Date(fromScheduledAt)) : null;
        const till = tillScheduledAt ? toDayNumber(new Date(tillScheduledAt)) : null;
        return measures.filter((measure) => {
            let result = true;
            const scheduledAt = measure.scheduledAt ? toDayNumber(new Date(measure.scheduledAt)) : NaN;
            if (from && from > scheduledAt) {
                result = false;
            }
            if (till && till < scheduledAt) {
                result = false;
            }
            return result;
        });
    }, [measures, fromScheduledAt, tillScheduledAt]);

    const bruttoMatrix: RiskMatrix | null = useMemo(() => {
        if (!transformedThreats || !matrixDesign) {
            return null;
        }
        return addThreatsToRiskMatrix(matrixDesign, transformedThreats, (threat) => {
            return { probability: threat.probability, damage: threat.damage };
        });
    }, [transformedThreats, matrixDesign]);

    const nettoMatrix: RiskMatrix | null = useMemo(() => {
        if (!transformedThreats || !matrixDesign) {
            return null;
        }
        return addThreatsToRiskMatrix(matrixDesign, transformedThreats, (threat) => {
            return { probability: threat.netProbability, damage: threat.netDamage };
        });
    }, [transformedThreats, matrixDesign]);

    const milestones: Milestone[] | null = useMemo(() => {
        if (!filteredMeasures) {
            return null;
        }
        if (!filteredThreats) {
            return null;
        }
        if (!matrixDesign) {
            return null;
        }
        const map: Record<number, Milestone> = filteredMeasures.reduce(
            (obj, item) => {
                if (!item.scheduledAt) {
                    return obj;
                }
                const scheduledAt = new Date(item.scheduledAt.toString().substring(0, 10));
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
        if (!milestones) {
            return null;
        }
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
        if (!transformedThreats) {
            return null;
        }

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
        ).catch((error) => {
            console.error("Excel export failed", error);
            showErrorMessage({ message: t("errorMessages.excelExportFailed") });
        });
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
        showComponentsPage,
        showAssetsPage,
        showMeasuresPage,
        showThreatListPage,
        showThreatsPage,
        systemImageOnSeparatePage,
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
        setShowComponentsPage,
        setShowAssetsPage,
        setShowMeasuresPage,
        setShowThreatListPage,
        setShowThreatsPage,
        setSystemImageOnSeparatePage,
        setReportLanguage,
        fullExportAsExcel,
    };
};
