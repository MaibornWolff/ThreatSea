import { ThreatsListPage } from "#view/report/pages/threatsList.report.page.tsx";
import { buildReportFixture, type ReportFixture } from "#view/report/testData/report-fixture.ts";
import { findAllByType, getTexts, renderPdfTree, runRenderProps } from "#test-utils/render-pdf-tree.tsx";

const renderThreatsList = (report: ReportFixture, indexCallback = vi.fn()) =>
    renderPdfTree(
        <ThreatsListPage
            indexCallback={indexCallback}
            threats={report.threats}
            threatGroups={report.threatGroups}
            project={report.project}
            logo={undefined}
            language="en"
            date="2024-01-15"
        />
    );

describe("ThreatsListPage (report)", () => {
    it("lists each generic threat followed by its concrete threats", async () => {
        const tree = await renderThreatsList(buildReportFixture());

        const texts = getTexts(tree);
        const tableStart = texts.indexOf("Component") + 1;
        expect(texts.slice(tableStart, tableStart + 12)).toEqual([
            "T.1",
            "Injection",
            "Database Server",
            "1",
            "SQL Injection",
            "Database Server",
            "T.2",
            "Credential Attack",
            "Login Form",
            "2",
            "Brute Force Login",
            "Login Form",
        ]);
    });

    it("links each concrete threat to its detail card but not the generic threat rows", async () => {
        const tree = await renderThreatsList(buildReportFixture());

        expect(findAllByType(tree, "LINK").map((link) => link.props["src"])).toEqual(["#threat-T-01", "#threat-T-02"]);
    });

    it("skips threat ids of a group that are not part of the report", async () => {
        const report = buildReportFixture();
        report.threatGroups[0]!.threatIds = [1, 999];

        const tree = await renderThreatsList(report);

        expect(findAllByType(tree, "LINK")).toHaveLength(2);
    });

    it("renders only the table header for a project without threats", async () => {
        const report = { ...buildReportFixture(), threats: [], threatGroups: [] };

        const tree = await renderThreatsList(report);

        expect(getTexts(tree)).toEqual(expect.arrayContaining(["List of Threats", "ID", "Name", "Component"]));
        expect(findAllByType(tree, "LINK")).toEqual([]);
    });

    it("registers itself in the table of contents", async () => {
        const indexCallback = vi.fn();
        const tree = await renderThreatsList(buildReportFixture(), indexCallback);

        runRenderProps(tree, { pageNumber: 10, totalPages: 12 });

        expect(indexCallback).toHaveBeenCalledWith(10, "List of Threats", "riskList");
    });
});
