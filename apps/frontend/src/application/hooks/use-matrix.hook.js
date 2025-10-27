import { useEffect, useMemo, useState } from "react";
import { useCatalogMeasures } from "./use-catalog-measures.hook";
import { useThreats } from "./use-threats.hook";
import { useMeasures } from "./use-measures.hook";
import { useSelector } from "react-redux";
import { projectsSelectors } from "../selectors/projects.selectors";
import { useMeasureImpacts } from "./use-measureImpacts.hook";
import { calcRiskColour } from "../../utils/calcRisk";

export const useMatrix = ({ projectId, catalogId, language }) => {
    const { lineOfToleranceGreen = 6, lineOfToleranceRed = 15 } = useSelector((state) =>
        projectsSelectors.selectById(state, projectId)
    );
    const { items, loadThreats } = useThreats({
        projectId,
    });
    const { items: catalogMeasures, loadCatalogMeasures } = useCatalogMeasures({
        catalogId,
    });
    const { items: measureImpacts, loadMeasureImpacts, deleteMeasureImpact } = useMeasureImpacts({ projectId });
    const [currentGreenValue, setCurrentGreenValue] = useState(lineOfToleranceGreen);
    const [currentRedValue, setCurrentRedValue] = useState(lineOfToleranceRed);
    const { items: measures, loadMeasures, deleteMeasure } = useMeasures({ projectId });
    const [selectedCell, setSelectedCell] = useState(null);
    const [timelineDate, setTimelineDate] = useState(null);
    const [threatSearchValue, setThreatSearchValue] = useState("");
    const [sortDirection, setSortDirection] = useState("asc");
    const [sortBy, setSortBy] = useState("name");

    const threats = useMemo(
        () =>
            items
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
                                const active = timelineDate?.getTime() >= measure?.scheduledAt?.getTime();
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
                                    newProbability > probability ? probability : newProbability,
                                    newDamage > damage ? damage : newDamage,
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
        [items, measures, timelineDate, measureImpacts]
    );

    const matrixDesign = useMemo(() => {
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

    const matrix = useMemo(() => {
        return threats.reduce(
            (arr, threat) => {
                const y = 5 - threat.newProbability;
                const x = threat.newDamage - 1;
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
    }, [threats, matrixDesign]);

    const filteredThreats = useMemo(() => {
        return threats.filter((threat) => {
            const lcSearchValue = threatSearchValue.toLowerCase();
            return (
                ((selectedCell === null ||
                    (threat.newProbability === selectedCell?.probability &&
                        threat.newDamage === selectedCell?.damage)) &&
                    ["name", "description", "componentName", "attacker", "pointOfAttack"].some((searchField) =>
                        threat[searchField].replace(/_/g, " ").toLowerCase().includes(lcSearchValue)
                    )) ||
                threat.id == threatSearchValue
            );
        });
    }, [selectedCell, threatSearchValue, threats]);

    const matrixSelected = useMemo(() => {
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

    const timeline = useMemo(() => {
        if (measures.length === 0) return [];
        const startDate = measures[0].scheduledAt;
        const endDate = measures[measures.length - 1].scheduledAt;
        const maxDate = Math.floor(endDate.getTime() / 1000 / 3600 / 24);
        const minDate = Math.floor(startDate.getTime() / 1000 / 3600 / 24);
        const minValue = -1;
        const maxValue = maxDate - minDate;
        const marks = measures.map((measure) => {
            const value = Math.floor(measure.scheduledAt.getTime() / 1000 / 3600 / 24) - minDate;
            const tooltipText = measure.scheduledAt.toISOString().split("T")[0];
            const date = measure.scheduledAt;
            date.setHours(0, 0, 0, 0);
            return {
                value: value,
                tooltipText: tooltipText,
                date: date,
                label: tooltipText,
            };
        });
        const timelineData = {
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

        return timelineData;
    }, [measures]);

    const sortedThreats = useMemo(
        () =>
            filteredThreats.sort((a, b) => {
                if (!a[sortBy]) {
                    a[sortBy] = "";
                }

                if (!b[sortBy]) {
                    b[sortBy] = "";
                }

                if (sortDirection === "asc") {
                    if (a[sortBy]?.toLowerCase && b[sortBy]?.toLowerCase) {
                        return a[sortBy].toLowerCase() < b[sortBy].toLowerCase() ? -1 : 1;
                    } else {
                        return a[sortBy] < b[sortBy] ? -1 : 1;
                    }
                } else {
                    if (a[sortBy]?.toLowerCase && b[sortBy]?.toLowerCase) {
                        return a[sortBy].toLowerCase() > b[sortBy].toLowerCase() ? -1 : 1;
                    } else {
                        return a[sortBy] > b[sortBy] ? -1 : 1;
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
