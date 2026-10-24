import { ComponentsDetailsPage } from "#view/report/pages/componentsDetails.report.page.tsx";
import { buildReportFixture } from "#view/report/testData/report-fixture.ts";
import { findAllByType, getTexts, renderPdfTree, runRenderProps } from "#test-utils/render-pdf-tree.tsx";

type ReportComponents = ReturnType<typeof buildReportFixture>["components"];

const renderComponentsPage = (components: ReportComponents, indexCallback = vi.fn()) =>
    renderPdfTree(
        <ComponentsDetailsPage
            indexCallback={indexCallback}
            language="en"
            project={buildReportFixture().project}
            date="2024-01-15"
            components={components}
        />
    );

describe("ComponentsDetailsPage (report)", () => {
    it("renders a card per component with report id, name and description", async () => {
        const tree = await renderComponentsPage(buildReportFixture().components);

        const texts = getTexts(tree);
        expect(texts).toEqual(
            expect.arrayContaining([
                "Components",
                "C.1 Database Server",
                "Central PostgreSQL database storing all customer and order records.",
                "C.2 Login Form",
            ])
        );
    });

    it("anchors each card at the component's report id so threats can link to it", async () => {
        const tree = await renderComponentsPage(buildReportFixture().components);

        const anchors = findAllByType(tree, "VIEW")
            .map((view) => view.props["id"])
            .filter(Boolean);
        expect(anchors).toEqual(["C.1", "C.2"]);
    });

    it("skips the description block for a component without description", async () => {
        const [component] = buildReportFixture().components;
        const tree = await renderComponentsPage([{ ...component!, description: "" }]);

        expect(getTexts(tree)).not.toContain("Description:");
    });

    it("renders only the chapter heading for a project without components", async () => {
        const tree = await renderComponentsPage([]);

        expect(getTexts(tree)).toEqual(["Sample Project | Report", "2024-01-15", "Components", "internal", ""]);
    });

    it("registers itself in the table of contents", async () => {
        const indexCallback = vi.fn();
        const tree = await renderComponentsPage([], indexCallback);

        runRenderProps(tree, { pageNumber: 7, totalPages: 12 });

        expect(indexCallback).toHaveBeenCalledWith(7, "Components", "componentsDetails");
    });
});
