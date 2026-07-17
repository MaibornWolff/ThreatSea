import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import type { ReactNode } from "react";
import { useMatrix } from "./use-matrix.hook";
import { createStore } from "#application/store.ts";
import { createMeasure, createMeasureImpact, createThreat } from "#test-utils/builders.ts";
import {
    mockUseCatalogMeasures,
    mockUseMeasureImpacts,
    mockUseMeasures,
    mockUseThreats,
} from "#test-utils/mock-hooks.ts";
import type { Measure } from "#api/types/measure.types.ts";
import type { MeasureImpact } from "#api/types/measure-impact.types.ts";
import type { ExtendedThreat } from "#api/types/threat.types.ts";

interface SetupArgs {
    threats?: ExtendedThreat[];
    measures?: Measure[];
    measureImpacts?: MeasureImpact[];
}

const renderUseMatrix = ({ threats = [], measures = [], measureImpacts = [] }: SetupArgs = {}) => {
    mockUseThreats({ items: threats });
    mockUseMeasures({ items: measures });
    mockUseMeasureImpacts({ items: measureImpacts });
    mockUseCatalogMeasures();

    const store = createStore();
    const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
    return renderHook(() => useMatrix({ projectId: 1, catalogId: 1, language: "en" }), { wrapper });
};

// A threat wired to a single measure through a measure impact, so the threat's
// derived `measures[0].active` flag reflects the timeline-date comparison.
const linkedSetup = (scheduledAt: string): SetupArgs => ({
    threats: [createThreat({ id: 1 })],
    measures: [createMeasure({ id: 10, scheduledAt })],
    measureImpacts: [createMeasureImpact({ id: 1, measureId: 10, threatId: 1 })],
});

describe("useMatrix", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("timeline", () => {
        it("anchors an empty timeline to an empty date string when there are no measures", () => {
            const { result } = renderUseMatrix({ measures: [] });
            const { timeline } = result.current;

            expect(timeline.marks).toEqual([]);
            expect(timeline.minValue).toBe(-1);
            expect(timeline.maxValue).toBe(0);
            expect(timeline.startDate).toBe("");
            expect(timeline.endDate).toBe("");
        });

        it("prepends a Start mark and adds one date-labelled mark per measure", () => {
            const measure = createMeasure({ id: 10, scheduledAt: "2025-03-10" });

            const { result } = renderUseMatrix({ measures: [measure] });
            const { marks } = result.current.timeline;

            expect(marks).toHaveLength(2);
            expect(marks[0]).toEqual({ value: -1, tooltipText: "Start", date: null, label: "Start" });
            expect(marks[1]?.value).toBe(0);
            expect(marks[1]?.tooltipText).toBe("2025-03-10");
            expect(marks[1]?.label).toBe("2025-03-10");
        });

        it("preserves the measure's scheduledAt string when building marks", () => {
            const scheduledAt = "2025-03-10";
            const measure = createMeasure({ id: 10, scheduledAt });

            const { result } = renderUseMatrix({ measures: [measure] });
            const { marks } = result.current.timeline;

            expect(marks[1]?.date).toBe(scheduledAt);
            expect(measure.scheduledAt).toBe(scheduledAt);
        });

        it("maps mark values to whole-day offsets from the earliest measure", () => {
            const measures = [
                createMeasure({ id: 1, scheduledAt: "2025-03-10" }),
                createMeasure({ id: 2, scheduledAt: "2025-03-12" }),
                createMeasure({ id: 3, scheduledAt: "2025-03-15" }),
            ];

            const { result } = renderUseMatrix({ measures });
            const { marks, minValue, maxValue } = result.current.timeline;

            expect(marks.slice(1).map((mark) => mark.value)).toEqual([0, 2, 5]);
            expect(minValue).toBe(-1);
            expect(maxValue).toBe(5);
        });

        it("collapses measures on the same calendar day to the same mark value", () => {
            const measures = [
                createMeasure({ id: 1, scheduledAt: "2025-03-10" }),
                createMeasure({ id: 2, scheduledAt: "2025-03-10" }),
            ];

            const { result } = renderUseMatrix({ measures });
            const { marks, maxValue } = result.current.timeline;

            expect(marks.slice(1).map((mark) => mark.value)).toEqual([0, 0]);
            expect(maxValue).toBe(0);
        });
    });

    describe("measure active flag", () => {
        it("is inactive while no timeline date is selected", () => {
            const { result } = renderUseMatrix(linkedSetup("2025-03-10"));

            expect(result.current.threats[0]?.measures[0]?.active).toBe(false);
        });

        it("activates when the timeline date is the same day as the measure", () => {
            const { result } = renderUseMatrix(linkedSetup("2025-03-10"));

            act(() => {
                result.current.setTimelineDate("2025-03-10");
            });

            expect(result.current.threats[0]?.measures[0]?.active).toBe(true);
        });

        it("stays inactive when the timeline date is on an earlier day", () => {
            const { result } = renderUseMatrix(linkedSetup("2025-03-10"));

            act(() => {
                result.current.setTimelineDate("2025-03-09");
            });

            expect(result.current.threats[0]?.measures[0]?.active).toBe(false);
        });

        it("activates when the timeline date is on a later day", () => {
            const { result } = renderUseMatrix(linkedSetup("2025-03-10"));

            act(() => {
                result.current.setTimelineDate("2025-03-11");
            });

            expect(result.current.threats[0]?.measures[0]?.active).toBe(true);
        });
    });
});
