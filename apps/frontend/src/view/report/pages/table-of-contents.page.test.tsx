import { TableOfContentsPage } from "#view/report/pages/table-of-contents.page.tsx";
import type { Index } from "#api/types/project.types.ts";
import { buildReportFixture } from "#view/report/testData/report-fixture.ts";
import { findAllByType, getTexts, renderPdfTree, runRenderProps } from "#test-utils/render-pdf-tree.tsx";

const renderTableOfContents = (index: Index, indexCallback = vi.fn()) =>
    renderPdfTree(
        <TableOfContentsPage
            indexCallback={indexCallback}
            project={buildReportFixture().project}
            index={index}
            language="en"
            date="2024-01-15"
        />
    );

describe("TableOfContentsPage (report)", () => {
    it("lists the chapters numbered and sorted by page number", async () => {
        const tree = await renderTableOfContents({
            matrix: { chapterId: "matrix", chapterName: "Risk Matrices", pageNumber: 5 },
            cover: { chapterId: "cover", chapterName: "Cover Page", pageNumber: 1 },
            method: { chapterId: "method", chapterName: "The 4x6 Methodology", pageNumber: 3 },
        });

        const rows = findAllByType(tree, "LINK").map(getTexts);
        expect(rows).toEqual([
            ["1.", "Cover Page", "1"],
            ["2.", "The 4x6 Methodology", "3"],
            ["3.", "Risk Matrices", "5"],
        ]);
    });

    it("links every row to the chapter anchor", async () => {
        const tree = await renderTableOfContents({
            cover: { chapterId: "cover", chapterName: "Cover Page", pageNumber: 1 },
        });

        expect(findAllByType(tree, "LINK").map((link) => link.props["src"])).toEqual(["#chapter-cover"]);
    });

    it("renders only the column headers while the index is still empty", async () => {
        const tree = await renderTableOfContents({});

        expect(findAllByType(tree, "LINK")).toEqual([]);
        expect(getTexts(tree)).toEqual(expect.arrayContaining(["Table of Contents", "Chapter", "Page"]));
    });

    it("registers itself in the table of contents", async () => {
        const indexCallback = vi.fn();
        const tree = await renderTableOfContents({}, indexCallback);

        runRenderProps(tree, { pageNumber: 2, totalPages: 12 });

        expect(indexCallback).toHaveBeenCalledWith(2, "Table of Contents", "tableOfContents");
    });
});
