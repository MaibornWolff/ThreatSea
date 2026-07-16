import type { ProjectReport } from "#api/types/project.types.ts";
import type { SortDirection } from "#application/actions/list.actions.ts";
import { createRiskMatrixDesign, addThreatsToRiskMatrix, dayNumberFromDateString } from "#utils/riskMatrix.ts";
import { useAlert } from "#application/hooks/use-alert.hook.ts";
import { useState, useMemo, useEffect, useEffectEvent, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ProjectsAPI } from "#api/projects.api.ts";
import { calcRiskColour } from "#utils/calcRisk.ts";
import {
    calcNetRiskMatrix,
    calcRiskBarGraph,
    filterMeasuresByScheduledRange,
    filterThreatsByScheduledRange,
    type Milestone,
    type RiskMatrix,
} from "#utils/report-risk.ts";

type ReportThreat = ProjectReport["threats"][number];
type ReportMeasure = ProjectReport["measures"][number];

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
        } catch (error) {
            console.error("Failed to fetch report", error);
            showErrorMessage({ message: t("errorMessages.reportFetchFailed") });
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
        return filterThreatsByScheduledRange(threats, fromScheduledAt, tillScheduledAt);
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
        return filterMeasuresByScheduledRange(measures, fromScheduledAt, tillScheduledAt);
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
                const scheduledAt = item.scheduledAt.slice(0, 10);
                const scheduledAtTime = dayNumberFromDateString(scheduledAt);
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
        return Object.values(map).sort((a, b) => (a.scheduledAt < b.scheduledAt ? -1 : 1));
    }, [filteredMeasures, filteredThreats, matrixDesign]);

    const transformedMilestones: Milestone[] | null = useMemo(() => {
        if (!milestones) {
            return null;
        }
        return milestones.map((milestone) => {
            const { scheduledAt } = milestone;
            return {
                ...milestone,
                active: riskMatrixMeasures.includes(scheduledAt),
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
    };
};
