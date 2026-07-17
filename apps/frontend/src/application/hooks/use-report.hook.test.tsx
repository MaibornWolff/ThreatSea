import { act, renderHook, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import type { ReactNode } from "react";
import { ProjectsAPI } from "#api/projects.api.ts";
import { mockUseAlert } from "#test-utils/mock-hooks.ts";
import {
    createProjectReport,
    createReportMeasure,
    createReportThreat,
    createReportThreatMeasure,
} from "#test-utils/builders.ts";
import { translationUtil } from "#utils/translations.ts";
import { useReport } from "#application/hooks/use-report.hook.ts";
import type { ProjectReport } from "#api/types/project.types.ts";

const wrapper = ({ children }: { children: ReactNode }) => (
    <I18nextProvider i18n={translationUtil}>{children}</I18nextProvider>
);

const renderUseReport = (report: ProjectReport) => {
    vi.spyOn(ProjectsAPI, "getReport").mockResolvedValue(report);
    return renderHook(() => useReport({ projectId: 1 }), { wrapper });
};

beforeEach(() => {
    mockUseAlert();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("useReport", () => {
    it("fetches the report on mount and exposes the data", async () => {
        const report = createProjectReport({ threats: [createReportThreat({ id: 1 })] });
        const { result } = renderUseReport(report);

        await waitFor(() => expect(result.current.data).not.toBeNull());

        expect(result.current.data?.threats).toHaveLength(1);
        expect(result.current.threats).toHaveLength(1);
    });

    it("shows an error message when the report fetch fails", async () => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);
        vi.spyOn(ProjectsAPI, "getReport").mockRejectedValue(new Error("boom"));
        const showErrorMessage = vi.fn();
        mockUseAlert({ showErrorMessage });

        renderHook(() => useReport({ projectId: 1 }), { wrapper });

        await waitFor(() => expect(showErrorMessage).toHaveBeenCalledTimes(1));
    });

    it("derives the filename from the project name once the report is loaded", async () => {
        const report = createProjectReport({ project: { ...createProjectReport().project, name: "My Project" } });
        const { result } = renderUseReport(report);

        await waitFor(() => expect(result.current.data).not.toBeNull());

        expect(result.current.filename).toMatch(/_My Project$/);
    });

    it("sorts threats by net risk descending by default and flips with the sort direction", async () => {
        const report = createProjectReport({
            threats: [createReportThreat({ id: 1, netRisk: 5 }), createReportThreat({ id: 2, netRisk: 20 })],
        });
        const { result } = renderUseReport(report);

        await waitFor(() => expect(result.current.threats).toHaveLength(2));
        expect(result.current.threats?.map((threat) => threat.netRisk)).toEqual([20, 5]);

        act(() => result.current.setSortDirection("asc"));
        expect(result.current.threats?.map((threat) => threat.netRisk)).toEqual([5, 20]);
    });

    it("recomputes the exposed net risk from the measures inside the selected date range (issue #877)", async () => {
        const threat = createReportThreat({
            probability: 4,
            damage: 5,
            netProbability: 2,
            netDamage: 3,
            netRisk: 6,
            measures: [
                createReportThreatMeasure({
                    scheduledAt: "2025-01-15",
                    impactsProbability: true,
                    probability: 2,
                }),
                createReportThreatMeasure({
                    scheduledAt: "2025-06-15",
                    impactsDamage: true,
                    damage: 3,
                }),
            ],
        });
        const { result } = renderUseReport(createProjectReport({ threats: [threat] }));

        await waitFor(() => expect(result.current.threats).toHaveLength(1));
        expect(result.current.threats?.[0]?.netRisk).toBe(6);

        act(() => {
            result.current.setFromScheduledAt("2025-01-01");
            result.current.setTillScheduledAt("2025-01-31");
        });

        expect(result.current.threats?.[0]?.netRisk).toBe(10);
    });

    it("groups milestones by measure date and toggles active via riskMatrixMeasures", async () => {
        const report = createProjectReport({
            threats: [createReportThreat({ id: 1 })],
            measures: [createReportMeasure({ scheduledAt: "2025-01-01" })],
        });
        const { result } = renderUseReport(report);

        await waitFor(() => expect(result.current.milestones).toHaveLength(1));
        expect(result.current.milestones?.[0]?.active).toBe(false);

        act(() => result.current.setRiskMatrixMeasures(["2025-01-01"]));

        expect(result.current.milestones?.[0]?.active).toBe(true);
    });
});
