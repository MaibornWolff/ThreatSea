import { MatrixPage } from "#view/report/pages/matrix.report.page.tsx";
import type { MatrixColorKey } from "#view/colors/matrix.ts";
import type { Milestone, RiskMatrix } from "#utils/report-risk.ts";
import type { IndexCallback } from "#api/types/project.types.ts";
import { buildReportFixture } from "#view/report/testData/report-fixture.ts";
import { getTexts, renderPdfTree, runRenderProps } from "#test-utils/render-pdf-tree.tsx";

const greenMatrix = (): RiskMatrix =>
    Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => ({ color: "green" as MatrixColorKey })));

const buildMilestone = (scheduledAt: string, active: boolean): Milestone => ({
    scheduledAt,
    active,
    matrix: greenMatrix(),
    barGraph: null,
});

const renderMatrixPage = ({
    tillScheduledAt = null,
    milestones = null,
    indexCallback = vi.fn<IndexCallback>(),
}: {
    tillScheduledAt?: string | null;
    milestones?: Milestone[] | null;
    indexCallback?: IndexCallback;
} = {}) =>
    renderPdfTree(
        <MatrixPage
            indexCallback={indexCallback}
            language="en"
            tillScheduledAt={tillScheduledAt}
            bruttoMatrix={greenMatrix()}
            nettoMatrix={greenMatrix()}
            project={buildReportFixture().project}
            date="2024-01-15"
            milestones={milestones}
        />
    );

const matrixTitles = (texts: string[]) => texts.filter((_, position) => texts[position - 1] === "Damage");

describe("MatrixPage (report)", () => {
    it("shows the matrices before and after measures", async () => {
        const tree = await renderMatrixPage();

        const texts = getTexts(tree);
        expect(texts).toContain("Risk Matrices");
        expect(matrixTitles(texts)).toEqual(["Before", "After"]);
    });

    it("states the start date when the report is limited to a schedule", async () => {
        const tree = await renderMatrixPage({ tillScheduledAt: "2024-06-01T10:00:00.000Z" });

        expect(getTexts(tree)).toContain("Start - 2024-06-01");
    });

    it("omits the start date without a schedule limit", async () => {
        const tree = await renderMatrixPage();

        expect(getTexts(tree).some((text) => text.startsWith("Start - "))).toBe(false);
    });

    it("adds one matrix per active milestone only", async () => {
        const tree = await renderMatrixPage({
            milestones: [
                buildMilestone("2024-03-01", true),
                buildMilestone("2024-04-01", false),
                buildMilestone("2024-05-01", true),
            ],
        });

        expect(matrixTitles(getTexts(tree))).toEqual(["Before", "After", "2024-03-01", "2024-05-01"]);
    });

    it("registers itself in the table of contents", async () => {
        const indexCallback = vi.fn<IndexCallback>();
        const tree = await renderMatrixPage({ indexCallback });

        runRenderProps(tree, { pageNumber: 6, totalPages: 12 });

        expect(indexCallback).toHaveBeenCalledWith(6, "Risk Matrices", "matrix");
    });
});
