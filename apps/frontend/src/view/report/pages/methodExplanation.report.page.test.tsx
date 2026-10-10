import { MethodExplanationPage } from "#view/report/pages/methodExplanation.report.page.tsx";
import { buildReportFixture } from "#view/report/testData/report-fixture.ts";
import { findAllByType, getTexts, renderPdfTree, runRenderProps } from "#test-utils/render-pdf-tree.tsx";

const renderMethodPage = (language: string, indexCallback = vi.fn()) =>
    renderPdfTree(
        <MethodExplanationPage
            indexCallback={indexCallback}
            language={language}
            project={buildReportFixture().project}
            date="2024-01-15"
        />
    );

describe("MethodExplanationPage (report)", () => {
    it("explains every attacker and point of attack", async () => {
        const tree = await renderMethodPage("en");

        const texts = getTexts(tree);
        expect(texts).toContain("The 4x6 Methodology");
        expect(texts).toEqual(
            expect.arrayContaining([
                "Attackers:",
                "Unauthorised Parties:",
                "(Technical) Administrators:",
                "Points Of Attack:",
                "User Interface:",
                "User Behaviour:",
            ])
        );
    });

    it("includes the 4x6 threat matrix", async () => {
        const tree = await renderMethodPage("en");

        expect(getTexts(tree)).toContain("Physical UI access");
    });

    it("renders the chapter in German", async () => {
        const tree = await renderMethodPage("de");

        expect(getTexts(tree)).toEqual(expect.arrayContaining(["Die 4x6 Methodik", "Dritte:"]));
        expect(
            findAllByType(tree, "TEXT").find((text) => text.props["id"] === "chapter-methodExplanation")
        ).toBeDefined();
    });

    it("registers itself in the table of contents", async () => {
        const indexCallback = vi.fn();
        const tree = await renderMethodPage("en", indexCallback);

        runRenderProps(tree, { pageNumber: 3, totalPages: 12 });

        expect(indexCallback).toHaveBeenCalledWith(3, "The 4x6 Methodology", "methodExplanation");
    });
});
