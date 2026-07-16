import { buildReportExcelTabs } from "#utils/report-excel.ts";
import {
    createMeasureImpact,
    createProjectReport,
    createReportMeasure,
    createReportThreat,
    createReportThreatMeasure,
} from "#test-utils/builders.ts";

const tabByName = (tabs: ReturnType<typeof buildReportExcelTabs>, name: string) =>
    tabs.find((tab) => tab.name === name)!;

describe("buildReportExcelTabs", () => {
    it("returns the four report sheets in order", () => {
        const tabs = buildReportExcelTabs(createProjectReport());
        expect(tabs.map((tab) => tab.name)).toEqual(["Assets", "Threats", "Measures", "Measure Impacts"]);
    });

    it("joins the asset ids and names of a threat into comma-separated strings", () => {
        const threat = createReportThreat({
            assets: [
                { id: 1, name: "Database", reportId: "A-01" },
                { id: 2, name: "API", reportId: "A-02" },
            ],
        });
        const tabs = buildReportExcelTabs(createProjectReport({ threats: [threat] }));

        const [row] = tabByName(tabs, "Threats").items as Record<string, unknown>[];
        expect(row!["assetIds"]).toBe("1, 2");
        expect(row!["assetNames"]).toBe("Database, API");
    });

    it("lists the relevant measures of a threat and leaves them empty when there are none", () => {
        const withMeasures = createReportThreat({
            id: 1,
            measures: [
                createReportThreatMeasure({ measureId: 10, name: "Input Validation" }),
                createReportThreatMeasure({ measureId: 11, name: "Rate Limiting" }),
            ],
        });
        const withoutMeasures = createReportThreat({ id: 2, measures: [] });
        const tabs = buildReportExcelTabs(createProjectReport({ threats: [withMeasures, withoutMeasures] }));

        const [first, second] = tabByName(tabs, "Threats").items as Record<string, unknown>[];
        expect(first!["relevantMeasures"]).toBe("10, 11");
        expect(first!["relevantMeasureNames"]).toBe("Input Validation, Rate Limiting");
        expect(second!["relevantMeasures"]).toBe("");
        expect(second!["relevantMeasureNames"]).toBe("");
    });

    it("sorts the threat rows by ascending id", () => {
        const tabs = buildReportExcelTabs(
            createProjectReport({
                threats: [createReportThreat({ id: 3 }), createReportThreat({ id: 1 }), createReportThreat({ id: 2 })],
            })
        );

        const ids = (tabByName(tabs, "Threats").items as Record<string, unknown>[]).map((row) => row["id"]);
        expect(ids).toEqual([1, 2, 3]);
    });

    it("joins the impacted threats of a measure", () => {
        const measure = createReportMeasure({
            threats: [
                { id: 1, name: "SQL Injection", reportId: "T-01" },
                { id: 2, name: "XSS", reportId: "T-02" },
            ],
        });
        const tabs = buildReportExcelTabs(createProjectReport({ measures: [measure] }));

        const [row] = tabByName(tabs, "Measures").items as Record<string, unknown>[];
        expect(row!["impactedThreatIds"]).toBe("1, 2");
        expect(row!["impactedThreatNames"]).toBe("SQL Injection, XSS");
    });

    it("labels null damage and probability of a measure impact as 'no Impact'", () => {
        const tabs = buildReportExcelTabs(
            createProjectReport({
                measureImpacts: [
                    {
                        ...createMeasureImpact({ damage: null, probability: 2 }),
                        measureReportId: "M-01",
                        threatReportId: "T-01",
                    },
                ],
            })
        );

        const [row] = tabByName(tabs, "Measure Impacts").items as Record<string, unknown>[];
        expect(row!["damage"]).toBe("no Impact");
        expect(row!["probability"]).toBe(2);
    });
});
