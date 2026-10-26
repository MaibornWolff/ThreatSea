import { ThreatsDetailsPage } from "#view/report/pages/threatsDetails.report.page.tsx";
import { THREAT_STATUSES } from "#api/types/threat-statuses.types.ts";
import { buildReportFixture, type ReportFixture } from "#view/report/testData/report-fixture.ts";
import { findAllByType, getTexts, renderPdfTree, runRenderProps, type PdfNode } from "#test-utils/render-pdf-tree.tsx";

interface LinkedPages {
    showComponentsPage: boolean;
    showAssetsPage: boolean;
    showMeasuresPage: boolean;
}

const allPagesShown: LinkedPages = { showComponentsPage: true, showAssetsPage: true, showMeasuresPage: true };

const renderThreatsDetails = (report: ReportFixture, linkedPages = allPagesShown, indexCallback = vi.fn()) =>
    renderPdfTree(
        <ThreatsDetailsPage
            indexCallback={indexCallback}
            language="en"
            project={report.project}
            logo={undefined}
            date="2024-01-15"
            threats={report.threats}
            threatGroups={report.threatGroups}
            {...linkedPages}
        />
    );

const threatCard = (tree: PdfNode, reportId: string) =>
    findAllByType(tree, "VIEW").find((view) => view.props["id"] === `threat-${reportId}`)!;

describe("ThreatsDetailsPage (report)", () => {
    it("renders the generic threat as a group heading with its description", async () => {
        const tree = await renderThreatsDetails(buildReportFixture());

        const texts = getTexts(tree);
        const groupStart = texts.indexOf("T.1");
        expect(texts.slice(groupStart, groupStart + 4)).toEqual([
            "T.1",
            "Injection",
            "Description",
            "Generic injection threats targeting stored data.",
        ]);
    });

    it("shows gross and net risk, context and description on the threat card", async () => {
        const tree = await renderThreatsDetails(buildReportFixture());

        expect(getTexts(threatCard(tree, "T-01"))).toEqual([
            "T-01",
            "SQL Injection",
            "ID: 1",
            "Confidentiality",
            "Integrity",
            "Availability",
            "Probability",
            "Damage",
            "Risk",
            "3",
            "4",
            "12",
            "(gross)",
            "2",
            "4",
            "8",
            "(net)",
            "Component",
            "C.1 Database Server",
            "Attackers",
            "Unauthorised Parties",
            "Points Of Attack",
            "Data Storage Infrastructure",
            "Assets",
            "A-01 Customer Database",
            "Description",
            "An attacker injects SQL commands via unvalidated input.\nThis can lead to data exfiltration or destruction.",
            "Measures",
            "M-01 Input Validation",
            "Parameterised queries have been added to all database calls.",
        ]);
    });

    it("links component, assets and measures to their chapters when those pages are included", async () => {
        const tree = await renderThreatsDetails(buildReportFixture());

        expect(findAllByType(threatCard(tree, "T-01"), "LINK").map((link) => link.props["src"])).toEqual([
            "#C.1",
            "#A-01",
            "#measure-M-01",
        ]);
    });

    it("prints plain labels without links when the linked pages are left out", async () => {
        const tree = await renderThreatsDetails(buildReportFixture(), {
            showComponentsPage: false,
            showAssetsPage: false,
            showMeasuresPage: false,
        });

        const card = threatCard(tree, "T-01");
        expect(findAllByType(card, "LINK")).toEqual([]);
        expect(getTexts(card)).toEqual(
            expect.arrayContaining(["Database Server", "A-01 Customer Database", "M-01 Input Validation"])
        );
        expect(getTexts(card)).not.toContain("C.1 Database Server");
    });

    it("replaces the net risk with 'Out of scope' for a threat marked out of scope", async () => {
        const report = buildReportFixture();
        Object.assign(report.threats[1]!, { status: THREAT_STATUSES.OUTOFSCOPE });

        const tree = await renderThreatsDetails(report);

        const texts = getTexts(threatCard(tree, "T-02"));
        expect(texts).toContain("Out of scope");
        expect(texts).not.toContain("6");
    });

    it("names the measure as the reason when a measure sets the threat out of scope", async () => {
        const report = buildReportFixture();
        report.threats[0]!.measures[0]!.setsOutOfScope = true;

        const tree = await renderThreatsDetails(report);

        expect(getTexts(threatCard(tree, "T-01"))).toContain("Out of scope by measure");
    });

    it("omits the measures block for a threat without measures", async () => {
        const tree = await renderThreatsDetails(buildReportFixture());

        expect(getTexts(threatCard(tree, "T-02"))).not.toContain("Measures");
    });

    it("registers itself in the table of contents", async () => {
        const indexCallback = vi.fn();
        const tree = await renderThreatsDetails(buildReportFixture(), allPagesShown, indexCallback);

        runRenderProps(tree, { pageNumber: 11, totalPages: 12 });

        expect(indexCallback).toHaveBeenCalledWith(11, "Threats", "riskDetails");
    });
});
