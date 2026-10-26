import { AssetsDetailsPage } from "#view/report/pages/assetsDetails.report.page.tsx";
import { buildReportFixture } from "#view/report/testData/report-fixture.ts";
import { findAllByType, getTexts, renderPdfTree, runRenderProps } from "#test-utils/render-pdf-tree.tsx";

type ReportAssets = Parameters<typeof AssetsDetailsPage>[0]["assets"];

const fixtureAssets = () => buildReportFixture().assets as ReportAssets;

const renderAssetsPage = (assets: ReportAssets, indexCallback = vi.fn()) =>
    renderPdfTree(
        <AssetsDetailsPage
            indexCallback={indexCallback}
            language="en"
            project={buildReportFixture().project}
            date="2024-01-15"
            assets={assets}
        />
    );

describe("AssetsDetailsPage (report)", () => {
    it("renders a card with id, protection needs, description and justifications", async () => {
        const tree = await renderAssetsPage(fixtureAssets().slice(0, 1));

        const card = findAllByType(tree, "VIEW").find((view) => view.props["id"] === "A-01")!;
        expect(getTexts(card)).toEqual([
            "A-01 Customer Database",
            "ID: 1",
            "Confidentiality:",
            "4",
            "Integrity:",
            "3",
            "Availability:",
            "2",
            "Description:",
            "Stores all customer PII data.",
            "Justification for Confidentiality:",
            "Contains names, addresses and payment data.",
            "Justification for Integrity:",
            "Data must be accurate for billing.",
            "Justification for Availability:",
            "Required during business hours.",
        ]);
    });

    it("leaves out empty description and justifications", async () => {
        const [asset] = fixtureAssets();
        const tree = await renderAssetsPage([
            { ...asset!, description: "", integrityJustification: "", availabilityJustification: "" },
        ]);

        const texts = getTexts(tree);
        expect(texts).not.toContain("Description:");
        expect(texts).not.toContain("Justification for Integrity:");
        expect(texts).not.toContain("Justification for Availability:");
        expect(texts).toContain("Justification for Confidentiality:");
    });

    it("anchors each card at the asset's report id", async () => {
        const tree = await renderAssetsPage(fixtureAssets());

        const anchors = findAllByType(tree, "VIEW")
            .map((view) => view.props["id"])
            .filter(Boolean);
        expect(anchors).toEqual(["A-01", "A-02"]);
    });

    it("renders only the chapter heading for a project without assets", async () => {
        const tree = await renderAssetsPage([]);

        expect(getTexts(tree)).toEqual(["Sample Project | Report", "2024-01-15", "Assets", "internal", ""]);
    });

    it("registers itself in the table of contents", async () => {
        const indexCallback = vi.fn();
        const tree = await renderAssetsPage([], indexCallback);

        runRenderProps(tree, { pageNumber: 8, totalPages: 12 });

        expect(indexCallback).toHaveBeenCalledWith(8, "Assets", "assetsDetails");
    });
});
