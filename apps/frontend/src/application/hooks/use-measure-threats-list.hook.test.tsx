import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { createStore } from "#application/store.ts";
import { createMeasureImpact, createThreat } from "#test-utils/builders.ts";
import { mockUseMeasureImpacts, mockUseThreats } from "#test-utils/mock-hooks.ts";
import { useMeasureThreatsList } from "./use-measure-threats-list.hook";

afterEach(() => {
    vi.restoreAllMocks();
});

const renderList = () => {
    const store = createStore();
    const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
    return renderHook(() => useMeasureThreatsList({ projectId: 1, measureId: 10 }), { wrapper });
};

describe("useMeasureThreatsList", () => {
    it("lists the measure's impacts with their threats", () => {
        mockUseThreats({ items: [createThreat({ id: 1, name: "Login bypass", componentName: "Web server" })] });
        mockUseMeasureImpacts({
            items: [
                createMeasureImpact({ id: 100, measureId: 10, threatId: 1, probability: 2 }),
                // another measure's impact
                createMeasureImpact({ id: 101, measureId: 11, threatId: 1 }),
            ],
        });

        const { result } = renderList();

        expect(result.current.measureThreats).toEqual([
            expect.objectContaining({
                measureImpactId: 100,
                threatId: 1,
                threatName: "Login bypass",
                componentName: "Web server",
                netProbability: 2,
            }),
        ]);
    });

    it("leaves out impacts on threats that are hidden because their point of attack has no assets", () => {
        // Threat 2 is hidden: the backend leaves it out of the loaded threats, but keeps its impact.
        mockUseThreats({ items: [createThreat({ id: 1, name: "Login bypass" })] });
        mockUseMeasureImpacts({
            items: [
                createMeasureImpact({ id: 100, measureId: 10, threatId: 1 }),
                createMeasureImpact({ id: 102, measureId: 10, threatId: 2 }),
            ],
        });

        const { result } = renderList();

        expect(result.current.measureThreats.map((item) => item.measureImpactId)).toEqual([100]);
    });
});
