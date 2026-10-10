import { Report, type ReportProps } from "#view/report/report.tsx";
import { buildReportFixture } from "#view/report/testData/report-fixture.ts";
import { findAllByType, getTexts, renderPdfTree } from "#test-utils/render-pdf-tree.tsx";

const renderReport = (overrides: Partial<ReportProps> = {}) =>
    renderPdfTree(<Report bruttoMatrix={null} nettoMatrix={null} data={buildReportFixture()} {...overrides} />);

const chapterAnchors = (tree: Awaited<ReturnType<typeof renderReport>>) =>
    findAllByType(tree, "TEXT")
        .map((text) => text.props["id"])
        .filter((id): id is string => typeof id === "string" && id.startsWith("chapter-"));

describe("Report", () => {
    it("renders every chapter in reading order by default", async () => {
        const tree = await renderReport();

        expect(tree.type).toBe("DOCUMENT");
        expect(findAllByType(tree, "PAGE")).toHaveLength(10);
        expect(chapterAnchors(tree)).toEqual([
            "chapter-tableOfContents",
            "chapter-methodExplanation",
            "chapter-explanationScale",
            "chapter-matrix",
            "chapter-componentsDetails",
            "chapter-assetsDetails",
            "chapter-measuresDetails",
            "chapter-riskList",
            "chapter-riskDetails",
        ]);
    });

    it("leaves out every chapter whose flag is switched off", async () => {
        const tree = await renderReport({
            showCoverPage: false,
            showTableOfContentsPage: false,
            showMethodExplanation: false,
            showScaleExplanation: false,
            showComponentsPage: false,
            showAssetsPage: false,
            showMeasuresPage: false,
            showThreatListPage: false,
        });

        expect(chapterAnchors(tree)).toEqual(["chapter-matrix", "chapter-riskDetails"]);
    });

    it("moves the system image from the cover to a page of its own", async () => {
        const tree = await renderReport({ systemImageOnSeparatePage: true });

        expect(findAllByType(tree, "PAGE")).toHaveLength(11);
        expect(chapterAnchors(tree)).toContain("chapter-systemImage");
    });

    it("drops the threat-card links to chapters that are not in the report", async () => {
        const tree = await renderReport({ showComponentsPage: false, showAssetsPage: false, showMeasuresPage: false });

        const linkTargets = findAllByType(tree, "LINK").map((link) => link.props["src"]);
        expect(linkTargets).not.toContain("#C.1");
        expect(linkTargets).not.toContain("#A-01");
        expect(linkTargets).not.toContain("#measure-M-01");
    });

    it("renders the whole report in German", async () => {
        const tree = await renderReport({ language: "de" });

        expect(getTexts(tree)).toEqual(
            expect.arrayContaining(["Inhaltsverzeichnis", "Die 4x6 Methodik", "Risiko Matrizen", "Komponenten"])
        );
    });
});
