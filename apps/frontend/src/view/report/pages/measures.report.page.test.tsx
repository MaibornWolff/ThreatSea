import { MeasuresDetailsPage } from "#view/report/pages/measures.report.page.tsx";
import { buildReportFixture } from "#view/report/testData/report-fixture.ts";
import { findAllByType, getTexts, renderPdfTree, runRenderProps } from "#test-utils/render-pdf-tree.tsx";

type ReportMeasures = Parameters<typeof MeasuresDetailsPage>[0]["measures"];

const fixtureMeasures = () => buildReportFixture().measures as unknown as ReportMeasures;

const renderMeasuresPage = (measures: ReportMeasures, indexCallback = vi.fn()) =>
    renderPdfTree(
        <MeasuresDetailsPage
            indexCallback={indexCallback}
            language="en"
            project={buildReportFixture().project}
            date="2024-01-15"
            measures={measures}
        />
    );

describe("MeasuresDetailsPage (report)", () => {
    it("renders a card with id, schedule, description and the threats it mitigates", async () => {
        const tree = await renderMeasuresPage(fixtureMeasures());

        const card = findAllByType(tree, "VIEW").find((view) => view.props["id"] === "measure-M-01")!;
        expect(getTexts(card)).toEqual([
            "M-01 Input Validation",
            "ID: 1",
            "2024-06-01",
            "Description",
            "Use parameterised queries and input sanitisation to prevent injection attacks.",
            "Threats",
            "1 SQL Injection",
        ]);
    });

    it("links each mitigated threat to its threat card", async () => {
        const tree = await renderMeasuresPage(fixtureMeasures());

        expect(findAllByType(tree, "LINK").map((link) => link.props["src"])).toEqual(["#threat-T-01"]);
    });

    it("leaves out description and threat list when both are empty", async () => {
        const [measure] = fixtureMeasures();
        const tree = await renderMeasuresPage([{ ...measure!, description: "", threats: [] }]);

        const texts = getTexts(tree);
        expect(texts).not.toContain("Description");
        expect(texts).not.toContain("Threats");
        expect(findAllByType(tree, "LINK")).toEqual([]);
    });

    it("renders only the chapter heading for a project without measures", async () => {
        const tree = await renderMeasuresPage([]);

        expect(getTexts(tree)).toEqual(["Sample Project | Report", "2024-01-15", "Measures", "internal", ""]);
    });

    it("registers itself in the table of contents", async () => {
        const indexCallback = vi.fn();
        const tree = await renderMeasuresPage([], indexCallback);

        runRenderProps(tree, { pageNumber: 9, totalPages: 12 });

        expect(indexCallback).toHaveBeenCalledWith(9, "Measures", "measuresDetails");
    });
});
