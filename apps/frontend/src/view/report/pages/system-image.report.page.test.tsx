import { SystemImagePage } from "#view/report/pages/system-image.report.page.tsx";
import { buildReportFixture } from "#view/report/testData/report-fixture.ts";
import { findAllByType, getTexts, renderPdfTree, runRenderProps } from "#test-utils/render-pdf-tree.tsx";

const renderSystemImagePage = (systemImage: string | null, indexCallback = vi.fn()) =>
    renderPdfTree(
        <SystemImagePage
            indexCallback={indexCallback}
            language="en"
            systemImage={systemImage}
            project={buildReportFixture().project}
            date="2024-01-15"
        />
    );

describe("SystemImagePage (report)", () => {
    it("shows the system image with its legend on a landscape page", async () => {
        const tree = await renderSystemImagePage("data:image/png;base64,system");

        expect(tree.props["orientation"]).toBe("landscape");
        expect(findAllByType(tree, "IMAGE").map((image) => image.props["src"])).toEqual([
            "data:image/png;base64,system",
        ]);
        expect(getTexts(tree)).toEqual(expect.arrayContaining(["System Image", "User Interface", "User Behaviour"]));
    });

    it("keeps title and legend when no system image exists yet", async () => {
        const tree = await renderSystemImagePage(null);

        expect(findAllByType(tree, "IMAGE")).toEqual([]);
        expect(getTexts(tree)).toContain("System Image");
    });

    it("registers itself in the table of contents", async () => {
        const indexCallback = vi.fn();
        const tree = await renderSystemImagePage(null, indexCallback);

        runRenderProps(tree, { pageNumber: 5, totalPages: 12 });

        expect(indexCallback).toHaveBeenCalledWith(5, "System Image", "systemImage");
    });
});
