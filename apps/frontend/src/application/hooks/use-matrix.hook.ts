import { useEffect, useMemo, useState } from "react";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import type { MeasureImpact } from "#api/types/measure-impact.types.ts";
import { calcRiskColour } from "../../utils/calcRisk";
import { useCatalogMeasures } from "./use-catalog-measures.hook.ts";
import { useMeasureImpacts } from "./use-measureImpacts.hook.ts";
import { useMeasures } from "./use-measures.hook.ts";
import { useThreats } from "./use-threats.hook.ts";
import { useAppSelector } from "./use-app-redux.hook.ts";
import { projectsSelectors } from "../selectors/projects.selectors.ts";
import type { SortDirection } from "#application/actions/list.actions.ts";
import type { MatrixColorKey } from "#view/colors/matrix.ts";

export interface ThreatMeasure {
    measureId: number;
    active: boolean;
    catalogMeasureId: number | null;
    name: string;
    description: string;
    scheduledAt: Date;
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
    date: Date | null;
    label: string;
}

export interface TimelineData {
    marks: TimelineMark[];
    startDate: Date;
    endDate: Date;
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
    const [timelineDate, setTimelineDate] = useState<Date | null>(null);
    const [threatSearchValue, setThreatSearchValue] = useState<string>("");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
    const [sortBy, setSortBy] = useState<"name" | "newProbability" | "newRisk" | "componentName">("name");

    const threats: ThreatWithMetrics[] = useMemo(
        () =>
            threatsRaw
                .map((item) => {
                    const { confidentiality, integrity, availability, probability, assets } = item;
                    const damage = assets.reduce((value, asset) => {
                        if (confidentiality && value < asset.confidentiality) {
                            value = asset.confidentiality;
                        }
                        if (integrity && value < asset.integrity) {
                            value = asset.integrity;
                        }
                        if (availability && value < asset.availability) {
                            value = asset.availability;
                        }
                        return value;
                    }, 0); // default 0 if no protection goal is affected
                    const risk = probability * damage;
                    return {
                        ...item,
                        risk,
                        damage,
                        assets,
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
                                    !!timelineDate && timelineDate.getTime() >= measure?.scheduledAt?.getTime();
                                return {
                                    measureId: measure.id,
                                    active: active,
                                    catalogMeasureId: null,
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
                    const [newProbability, newDamage] = measures
                        .filter((measure) => measure.active)
                        .reduce(
                            (arr, measure) => {
                                const [newProbability, newDamage] = arr;
                                if (measure.measureImpact == null) {
                                    return [newProbability, newDamage];
                                }

                                let { probability, damage } = measure.measureImpact;

                                if (!measure.measureImpact.impactsDamage) {
                                    damage = newDamage;
                                }
                                if (!measure.measureImpact.impactsProbability) {
                                    probability = newProbability;
                                }

                                probability = measure.measureImpact.setsOutOfScope ? 0 : probability;
                                damage = measure.measureImpact.setsOutOfScope ? 0 : damage;
                                return [
                                    probability != null && newProbability > probability ? probability : newProbability,
                                    damage != null && newDamage > damage ? damage : newDamage,
                                ];
                            },
                            [probability, damage]
                        );
                    const risk = probability * damage;
                    const newRisk = newProbability * newDamage;
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
        const matrix = [];
        for (let y = 0; y < 5; y++) {
            const row = [];
            for (let x = 0; x < 5; x++) {
                const color = calcRiskColour(x + 1, 5 - y, currentGreenValue, currentRedValue);
                row.push({
                    color,
                });
            }
            matrix.push(row);
        }
        return matrix;
    }, [currentGreenValue, currentRedValue]);

    const matrix: MatrixGrid = useMemo(() => {
        return threats.reduce(
            (arr, threat) => {
                const y = 5 - threat.newProbability;
                const x = threat.newDamage - 1;
                if (x >= 0 && y >= 0 && arr[y]?.[x]) {
                    // if no protection goal is affected risk is not in the matrix
                    if (typeof arr[y]?.[x]?.amount !== "number") {
                        arr[y][x].amount = 0;
                    }
                    arr[y][x].amount++;
                }
                return arr;
            },
            [...matrixDesign.map((row) => [...row].map((cell) => ({ ...cell })))]
        );
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
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return {
                marks: [],
                startDate: today,
                endDate: today,
                minValue: -1,
                maxValue: 0,
            };
        }

        const startDate = measures[0]?.scheduledAt ?? new Date();
        const endDate = measures[measures.length - 1]?.scheduledAt ?? new Date();
        const maxDate = Math.floor(endDate.getTime() / 1000 / 3600 / 24);
        const minDate = Math.floor(startDate.getTime() / 1000 / 3600 / 24);
        const minValue = -1;
        const maxValue = maxDate - minDate;
        const marks: TimelineMark[] = measures.map((measure) => {
            const value = Math.floor(measure.scheduledAt.getTime() / 1000 / 3600 / 24) - minDate;
            const tooltipText = measure.scheduledAt.toISOString().split("T")[0] ?? "";
            const date = measure.scheduledAt;
            date.setHours(0, 0, 0, 0);
            return {
                value: value,
                tooltipText: tooltipText,
                date: date,
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
        loadThreats,
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
