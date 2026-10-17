import { ScaleExplanationPage } from "#view/report/pages/scaleExplanation.report.page.tsx";
import { buildReportFixture } from "#view/report/testData/report-fixture.ts";
import { getTexts, renderPdfTree, runRenderProps } from "#test-utils/render-pdf-tree.tsx";

const renderScalePage = (indexCallback = vi.fn()) =>
    renderPdfTree(
        <ScaleExplanationPage
            indexCallback={indexCallback}
            language="en"
            date="2024-01-15"
            index={{}}
            {...buildReportFixture()}
        />
    );

describe("ScaleExplanationPage (report)", () => {
    it("lists five numbered probability levels followed by five damage levels", async () => {
        const tree = await renderScalePage();

        const texts = getTexts(tree);
        const levelHeadings = texts.filter((text) => /^\d - /.test(text));
        expect(levelHeadings).toHaveLength(10);
        expect(levelHeadings.map((heading) => heading[0])).toEqual(["1", "2", "3", "4", "5", "1", "2", "3", "4", "5"]);
        expect(levelHeadings[0]).toBe("1 - extremely unlikely\n");
        expect(levelHeadings[5]).toBe("1 - very neglectable\n");
        expect(texts.indexOf("Probability")).toBeLessThan(texts.indexOf("Damage"));
    });

    it("registers itself in the table of contents", async () => {
        const indexCallback = vi.fn();
        const tree = await renderScalePage(indexCallback);

        runRenderProps(tree, { pageNumber: 4, totalPages: 12 });

        expect(indexCallback).toHaveBeenCalledWith(
            4,
            "Explanation of Probability and Damage Scale",
            "explanationScale"
        );
    });
});
