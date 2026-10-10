import { Page } from "#view/report/components/page.report.component.tsx";
import { Text } from "#view/report/components/text.report.component.tsx";
import { findAllByType, getText, getTexts, renderPdfTree, runRenderProps } from "#test-utils/render-pdf-tree.tsx";

const renderPage = (orientation: "portrait" | "landscape" = "portrait") =>
    renderPdfTree(
        <Page projectName="Sample Project" date="2024-01-15" confidentialityLevel="internal" orientation={orientation}>
            <Text>Chapter body</Text>
        </Page>
    );

describe("Page (report)", () => {
    it("renders an A4 page with the project header, the content and the confidentiality footer", async () => {
        const tree = await renderPage();

        expect(tree.type).toBe("PAGE");
        expect(tree.props["size"]).toBe("A4");
        expect(getTexts(tree)).toEqual(["Sample Project | Report", "2024-01-15", "Chapter body", "internal", ""]);
    });

    it("keeps header and footer fixed so they repeat on every wrapped page", async () => {
        const tree = await renderPage();

        const fixedViews = findAllByType(tree, "VIEW").filter((view) => view.props["fixed"] === true);
        expect(fixedViews.map(getText)).toEqual(["Sample Project | Report2024-01-15", "internal"]);
    });

    it("prints the current page number in the footer", async () => {
        const tree = await renderPage();

        expect(runRenderProps(tree, { pageNumber: 4, totalPages: 10 }).map(getText)).toEqual(["4"]);
    });

    it("forwards page props such as the orientation to react-pdf", async () => {
        const tree = await renderPage("landscape");

        expect(tree.props["orientation"]).toBe("landscape");
    });
});
