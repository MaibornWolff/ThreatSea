import { useEffect, useMemo, useState } from "react";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import type { MeasureImpact } from "#api/types/measure-impact.types.ts";
import { calcNetRisk } from "#utils/calcRisk.ts";
import { createRiskMatrixDesign, addThreatsToRiskMatrix, dayNumberFromDateString } from "#utils/riskMatrix.ts";
import { useCatalogMeasures } from "./use-catalog-measures.hook.ts";
import { useThreats } from "./use-threats.hook.ts";
import { useMeasureImpacts } from "./use-measureImpacts.hook.ts";
import { useMeasures } from "./use-measures.hook.ts";
import { useAppSelector } from "./use-app-redux.hook.ts";
import { projectsSelectors } from "#application/selectors/projects.selectors.ts";
import type { SortDirection } from "#application/actions/list.actions.ts";
import type { MatrixColorKey } from "#view/colors/matrix.ts";
import { calcDamage } from "#utils/helpers.ts";
import { THREAT_STATUSES } from "#api/types/threat-statuses.types.ts";

export interface ThreatMeasure {
    measureId: number;
    active: boolean;
    catalogMeasureId: number | null;
    name: string;
    description: string;
    scheduledAt: string;
    measureImpact: MeasureImpact | undefined;
}

export type ThreatWithMetrics = ExtendedThreat & {
    risk: number;
    damage: number;
    measures: ThreatMeasure[];
    newProbability: number;
    newDamage: number;
    newRisk: number;
    activeMeasures: number;
    measuresDone: boolean;
};

interface MatrixCell {
    color: MatrixColorKey;
    amount?: number;
    selected?: boolean;
}

export type MatrixGrid = MatrixCell[][];

interface TimelineMark {
    value: number;
    tooltipText: string;
    date: string | null;
    label: string;
}

export interface TimelineData {
    marks: TimelineMark[];
    startDate: string;
    endDate: string;
    minValue: number;
    maxValue: number;
}

export interface SelectedMatrixCell {
    probability: number;
    damage: number;
}

interface UseMatrixArgs {
    projectId: number;
    catalogId: number;
    language: string;
}

const sortableThreatFields: (keyof Pick<
    ThreatWithMetrics,
    "name" | "description" | "componentName" | "attacker" | "pointOfAttack"
>)[] = ["name", "description", "componentName", "attacker", "pointOfAttack"];

export const useMatrix = ({ projectId, catalogId }: UseMatrixArgs) => {
    const project = useAppSelector((state) => projectsSelectors.selectById(state, projectId));
    const defaultGreen = project?.lineOfToleranceGreen ?? 6;
    const defaultRed = project?.lineOfToleranceRed ?? 15;

    const { items: threatsRaw, loadThreats } = useThreats({ projectId });
    const { loadCatalogMeasures } = useCatalogMeasures({ catalogId });
    const { items: measureImpacts, loadMeasureImpacts, deleteMeasureImpact } = useMeasureImpacts({ projectId });
    const { items: measures, loadMeasures, deleteMeasure } = useMeasures({ projectId });

    const [currentGreenValue, setCurrentGreenValue] = useState<number>(defaultGreen);
    const [currentRedValue, setCurrentRedValue] = useState<number>(defaultRed);
    const [selectedCell, setSelectedCell] = useState<SelectedMatrixCell | null>(null);
    const [timelineDate, setTimelineDate] = useState<string | null>(null);
    const [threatSearchValue, setThreatSearchValue] = useState<string>("");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
    const [sortBy, setSortBy] = useState<"name" | "newProbability" | "newRisk" | "componentName">("name");

    const threats: ThreatWithMetrics[] = useMemo(
        () =>
            threatsRaw
                .map((threat) => {
                    const damage = calcDamage(threat);
                    const risk = threat.probability * damage;
                    return {
                        ...threat,
                        risk,
                        damage,
                    };
                })
                .map((threat) => {
                    return {
                        ...threat,
                        measures: measures
                            .filter((measure) => {
                                return measureImpacts.some((measureImpact) => {
                                    return measureImpact.measureId == measure.id && measureImpact.threatId == threat.id;
                                });
                            })
                            .map((measure) => {
                                const active =
                                    !!timelineDate &&
                                    dayNumberFromDateString(timelineDate) >=
                                        dayNumberFromDateString(measure.scheduledAt);
                                return {
                                    measureId: measure.id,
                                    active: active,
                                    catalogMeasureId: measure.catalogMeasureId,
                                    name: measure.name,
                                    description: measure.description,
                                    scheduledAt: measure.scheduledAt,
                                    measureImpact: measureImpacts.find((measureImpact) => {
                                        return (
                                            measureImpact.measureId == measure.id && measureImpact.threatId == threat.id
                                        );
                                    }),
                                };
                            }),
                    };
                })
                .map((threat) => {
                    const { measures, probability, damage } = threat;
                    const activeMeasureImpacts = measures
                        .filter((measure) => measure.active)
                        .map((measure) => measure.measureImpact);
                    const {
                        netProbability: newProbability,
                        netDamage: newDamage,
                        netRisk: newRisk,
                    } = threat.status === THREAT_STATUSES.OUTOFSCOPE
                        ? { netProbability: 0, netDamage: 0, netRisk: 0 }
                        : calcNetRisk(probability, damage, activeMeasureImpacts);
                    const risk = probability * damage;
                    const activeMeasures = measures.reduce((sum, measure) => {
                        if (measure.scheduledAt) {
                            sum++;
                        }
                        return sum;
                    }, 0);
                    const measuresDone =
                        activeMeasures === measures.length || (newDamage === 1 && newProbability === 1);
                    return {
                        ...threat,
                        risk,
                        newRisk,
                        newProbability,
                        newDamage,
                        activeMeasures,
                        measuresDone,
                    };
                }),
        [threatsRaw, measures, timelineDate, measureImpacts]
    );

    const matrixDesign: MatrixGrid = useMemo(() => {
        return createRiskMatrixDesign(currentGreenValue, currentRedValue);
    }, [currentGreenValue, currentRedValue]);

    const matrix: MatrixGrid = useMemo(() => {
        return addThreatsToRiskMatrix(matrixDesign, threats, (threat) => ({
            probability: threat.newProbability,
            damage: threat.newDamage,
        }));
    }, [threats, matrixDesign]);

    const filteredThreats: ThreatWithMetrics[] = useMemo(() => {
        const lcSearchValue = threatSearchValue.toLowerCase();
        return threats.filter((threat) => {
            return (
                ((selectedCell === null ||
                    (threat.newProbability === selectedCell?.probability &&
                        threat.newDamage === selectedCell?.damage)) &&
                    sortableThreatFields.some((searchField) =>
                        threat[searchField]?.replace(/_/g, " ").toLowerCase().includes(lcSearchValue)
                    )) ||
                `${threat.id}` == threatSearchValue
            );
        });
    }, [threats, selectedCell, threatSearchValue]);

    const matrixSelected = useMemo<MatrixGrid>(() => {
        return matrix.map((row, y) =>
            row.map((cell, x) => {
                const probability = 5 - y;
                const damage = x + 1;
                return {
                    ...cell,
                    selected: selectedCell?.probability === probability && selectedCell?.damage === damage,
                };
            })
        );
    }, [matrix, selectedCell]);

    const timeline: TimelineData = useMemo(() => {
        if (measures.length === 0) {
            return {
                marks: [],
                startDate: "",
                endDate: "",
                minValue: -1,
                maxValue: 0,
            };
        }

        const startDate = measures[0]?.scheduledAt ?? "";
        const endDate = measures[measures.length - 1]?.scheduledAt ?? "";
        const maxDate = dayNumberFromDateString(endDate);
        const minDate = dayNumberFromDateString(startDate);
        const minValue = -1;
        const maxValue = maxDate - minDate;
        const marks: TimelineMark[] = measures.map((measure) => {
            const value = dayNumberFromDateString(measure.scheduledAt) - minDate;
            const tooltipText = measure.scheduledAt;
            return {
                value: value,
                tooltipText: tooltipText,
                date: measure.scheduledAt,
                label: tooltipText,
            };
        });

        return {
            marks: [
                {
                    value: -1,
                    tooltipText: "Start",
                    date: null,
                    label: "Start",
                },
                ...marks,
            ],
            startDate,
            endDate,
            minValue,
            maxValue,
        };
    }, [measures]);

    const sortedThreats: ThreatWithMetrics[] = useMemo(
        () =>
            filteredThreats.sort((a, b) => {
                if (sortDirection === "asc") {
                    if (typeof a[sortBy] === "string" && typeof b[sortBy] === "string") {
                        return a[sortBy].toLowerCase() < b[sortBy].toLowerCase() ? -1 : 1;
                    } else {
                        return (a[sortBy] ?? "") < (b[sortBy] ?? "") ? -1 : 1;
                    }
                } else {
                    if (typeof a[sortBy] === "string" && typeof b[sortBy] === "string") {
                        return a[sortBy].toLowerCase() > b[sortBy].toLowerCase() ? -1 : 1;
                    } else {
                        return (a[sortBy] ?? "") > (b[sortBy] ?? "") ? -1 : 1;
                    }
                }
            }),
        [filteredThreats, sortBy, sortDirection]
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
        setSelectedCell,
        setTimelineDate,
        setSortDirection,
        setSortBy,
        setThreatSearchValue,
        deleteMeasure,
        deleteMeasureImpact,
        setCurrentGreenValue,
        setCurrentRedValue,
        loadMeasures,
        loadThreats: loadThreats,
        loadCatalogMeasures,
        currentRedValue,
        currentGreenValue,
        sortBy,
        sortDirection,
        matrix: matrixSelected,
        selectedCell,
        threats: sortedThreats,
        timeline: {
            ...timeline,
            currentDate: timelineDate,
        },
    };
};
