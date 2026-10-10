import { CoverPage } from "#view/report/pages/cover.report.page.tsx";
import { buildReportFixture } from "#view/report/testData/report-fixture.ts";
import { findAllByType, getTexts, renderPdfTree, runRenderProps } from "#test-utils/render-pdf-tree.tsx";

const renderCoverPage = (overrides: { systemImageOnSeparatePage?: boolean; language?: string } = {}) => {
    const indexCallback = vi.fn();
    const report = { ...buildReportFixture(), systemImage: "data:image/png;base64,system" };
    const treePromise = renderPdfTree(
        <CoverPage
            indexCallback={indexCallback}
            logo="threatsea-logo.png"
            companyLogo="company-logo.png"
            date="2024-01-15"
            language={overrides.language ?? "en"}
            systemImageOnSeparatePage={overrides.systemImageOnSeparatePage ?? false}
            {...report}
        />
    );
    return { treePromise, indexCallback };
};

describe("CoverPage (report)", () => {
    it("shows project name, date, confidentiality level and description", async () => {
        const tree = await renderCoverPage().treePromise;

        const texts = getTexts(tree);
        expect(texts.slice(0, 4)).toEqual([
            "Sample Project",
            "Cyber Security | MaibornWolff",
            "2024-01-15",
            "internal",
        ]);
        expect(texts).toContain("This is the project description.\n\nIt spans multiple paragraphs.\nWith line breaks.");
    });

    it("renders the app logo, the company logo and the system image", async () => {
        const tree = await renderCoverPage().treePromise;

        expect(findAllByType(tree, "IMAGE").map((image) => image.props["src"])).toEqual([
            "threatsea-logo.png",
            "company-logo.png",
            "data:image/png;base64,system",
        ]);
        expect(getTexts(tree)).toContain("User Interface");
    });

    it("leaves out system image and legend when they get a separate page", async () => {
        const tree = await renderCoverPage({ systemImageOnSeparatePage: true }).treePromise;

        expect(findAllByType(tree, "IMAGE")).toHaveLength(2);
        expect(getTexts(tree)).not.toContain("User Interface");
    });

    it("registers itself in the table of contents with its page number", async () => {
        const { treePromise, indexCallback } = renderCoverPage();
        const tree = await treePromise;

        runRenderProps(tree, { pageNumber: 1, totalPages: 12 });

        expect(indexCallback).toHaveBeenCalledWith(1, "Cover Page", "cover");
    });

    it("translates the confidentiality level", async () => {
        const tree = await renderCoverPage({ language: "de" }).treePromise;

        expect(getTexts(tree)[3]).toBe("intern");
    });
});
