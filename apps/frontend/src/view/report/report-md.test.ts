import "#utils/translations.ts"; // initialises i18next with all namespaces as a side effect
import { generateMarkdownReport, type MarkdownReportOptions } from "#view/report/report-md.ts";
import type { ProjectReport } from "#api/types/project.types.ts";
import type { RiskMatrix } from "#application/hooks/use-report.hook.ts";
import fixtureData from "./testData/project-report.fixture.json";

const report = fixtureData as unknown as ProjectReport & { milestones: null };

const BASE_OPTIONS: MarkdownReportOptions = {
    data: report,
    date: "2025-01-15",
};

// ---------------------------------------------------------------------------
// Snapshot tests
// ---------------------------------------------------------------------------

describe("generateMarkdownReport – snapshot", () => {
    it("produces the expected english report", async () => {
        const md = generateMarkdownReport({ ...BASE_OPTIONS, language: "en" });
        await expect(md).toMatchFileSnapshot("./testData/expected-report.en.md");
    });

    it("produces the expected german report", async () => {
        const md = generateMarkdownReport({ ...BASE_OPTIONS, language: "de" });
        await expect(md).toMatchFileSnapshot("./testData/expected-report.de.md");
    });
});

// ---------------------------------------------------------------------------
// Section toggling
// ---------------------------------------------------------------------------

describe("generateMarkdownReport – section toggling", () => {
    it("omits the cover page heading when showCoverPage is false", () => {
        const md = generateMarkdownReport({ ...BASE_OPTIONS, language: "en", showCoverPage: false });
        expect(md).not.toContain(`# ${report.project.name}`);
    });

    it("omits assets section when showAssetsPage is false", () => {
        const md = generateMarkdownReport({ ...BASE_OPTIONS, language: "en", showAssetsPage: false });
        expect(md).not.toContain("chapter-assetsDetails");
    });

    it("omits measures section when showMeasuresPage is false", () => {
        const md = generateMarkdownReport({ ...BASE_OPTIONS, language: "en", showMeasuresPage: false });
        expect(md).not.toContain("chapter-measuresDetails");
    });

    it("omits threat sections when showThreatsPage and showThreatListPage are false", () => {
        const md = generateMarkdownReport({
            ...BASE_OPTIONS,
            language: "en",
            showThreatsPage: false,
            showThreatListPage: false,
        });
        expect(md).not.toContain("chapter-riskDetails");
        expect(md).not.toContain("chapter-riskList");
    });
});

// ---------------------------------------------------------------------------
// Injection prevention – block context (descriptions)
// ---------------------------------------------------------------------------

describe("generateMarkdownReport – injection prevention", () => {
    const withProjectDescription = (description: string): MarkdownReportOptions => ({
        ...BASE_OPTIONS,
        language: "en",
        data: { ...report, project: { ...report.project, description } },
    });

    it("escapes ATX headings in project description", () => {
        const md = generateMarkdownReport(withProjectDescription("### Injected heading"));
        expect(md).toContain("\\### Injected heading");
    });

    it("escapes bare ATX headings without trailing space", () => {
        const md = generateMarkdownReport(withProjectDescription("###"));
        expect(md).toContain("\\###");
    });

    it("escapes thematic breaks / setext underlines in project description", () => {
        const md = generateMarkdownReport(withProjectDescription("---"));
        expect(md).toContain("\\---");
    });

    it("escapes fenced code block delimiters in project description", () => {
        const md = generateMarkdownReport(withProjectDescription("```js\nalert(1)\n```"));
        expect(md).toContain("\\```js");
    });

    it("escapes HTML block openers in project description", () => {
        const md = generateMarkdownReport(withProjectDescription("<script>alert(1)</script>"));
        expect(md).toContain("\\<script>");
    });

    it("escapes pipe characters in threat component names (table cell context)", () => {
        const threat = { ...report.threats[0]!, componentName: "Server | Database" };
        const md = generateMarkdownReport({ ...BASE_OPTIONS, language: "en", data: { ...report, threats: [threat] } });
        expect(md).toContain("Server \\| Database");
    });

    it("escapes closing square brackets in threat names (link text context)", () => {
        const threat = { ...report.threats[0]!, name: "Threat ] Injection" };
        const md = generateMarkdownReport({ ...BASE_OPTIONS, language: "en", data: { ...report, threats: [threat] } });
        expect(md).toContain("Threat \\] Injection");
    });
});

// ---------------------------------------------------------------------------
// Line break preservation – block context (descriptions)
// ---------------------------------------------------------------------------

describe("generateMarkdownReport – line break preservation", () => {
    it("converts single newlines to Markdown hard line breaks", () => {
        const md = generateMarkdownReport({
            ...BASE_OPTIONS,
            language: "en",
            data: { ...report, project: { ...report.project, description: "First line\nSecond line" } },
        });
        expect(md).toContain("First line  \nSecond line");
    });

    it("preserves paragraph breaks (double newlines) in descriptions", () => {
        const md = generateMarkdownReport({
            ...BASE_OPTIONS,
            language: "en",
            data: { ...report, project: { ...report.project, description: "Para one\n\nPara two" } },
        });
        expect(md).toContain("Para one\n\nPara two");
    });
});

// ---------------------------------------------------------------------------
// Matrix rendering
// ---------------------------------------------------------------------------

// 5×5 matrix: outer index 0 = P5 (highest), inner index 0 = D1 (lowest)
const TEST_MATRIX: RiskMatrix = [
    // P5
    [{ color: "red", amount: 2 }, { color: "red" }, { color: "red" }, { color: "red" }, { color: "red" }],
    // P4
    [{ color: "yellow", amount: 1 }, { color: "red" }, { color: "red" }, { color: "red" }, { color: "red" }],
    // P3
    [{ color: "green" }, { color: "yellow" }, { color: "yellow" }, { color: "red" }, { color: "red" }],
    // P2
    [{ color: "green" }, { color: "green" }, { color: "yellow" }, { color: "yellow" }, { color: "red" }],
    // P1
    [{ color: "green" }, { color: "green" }, { color: "green" }, { color: "yellow" }, { color: "yellow" }],
];

describe("generateMarkdownReport – matrix rendering", () => {
    const matrixOptions: MarkdownReportOptions = {
        ...BASE_OPTIONS,
        language: "en",
        bruttoMatrix: TEST_MATRIX,
    };

    it("renders the matrix table header row", () => {
        const md = generateMarkdownReport(matrixOptions);
        expect(md).toContain("| P \\ D | D1 | D2 | D3 | D4 | D5 |");
    });

    it("renders probability row labels P5 through P1", () => {
        const md = generateMarkdownReport(matrixOptions);
        for (const label of ["P5", "P4", "P3", "P2", "P1"]) {
            expect(md).toContain(`| ${label} |`);
        }
    });

    it("renders cell colors as G/Y/R abbreviations", () => {
        const md = generateMarkdownReport(matrixOptions);
        // P5 D1: red with count 2
        expect(md).toContain("R:2");
        // P4 D1: yellow with count 1
        expect(md).toContain("Y:1");
        // P1 starts with three green cells without counts
        expect(md).toContain("| P1 | G | G | G |");
    });

    it("renders the axis legend explaining P and D", () => {
        const md = generateMarkdownReport(matrixOptions);
        expect(md).toContain("P = Probability");
        expect(md).toContain("D = Damage");
    });

    it("renders the color legend explaining G/Y/R", () => {
        const md = generateMarkdownReport(matrixOptions);
        expect(md).toContain("G = green (low risk)");
        expect(md).toContain("Y = yellow (medium risk)");
        expect(md).toContain("R = red (high risk)");
    });

    it("renders axis and color legends in German", () => {
        const md = generateMarkdownReport({ ...matrixOptions, language: "de" });
        expect(md).toContain("P = Wahrscheinlichkeit");
        expect(md).toContain("D = Schaden");
        expect(md).toContain("G = grün (geringes Risiko)");
    });

    it("renders the brutto matrix with 'Before' title", () => {
        const md = generateMarkdownReport(matrixOptions);
        expect(md).toContain("**Before**");
    });

    it("renders the netto matrix with 'After' title", () => {
        const md = generateMarkdownReport({ ...matrixOptions, bruttoMatrix: undefined, nettoMatrix: TEST_MATRIX });
        expect(md).toContain("**After**");
        expect(md).toContain("| P \\ D | D1 | D2 | D3 | D4 | D5 |");
    });

    it("omits the matrix section when showMatrixPage is false", () => {
        const md = generateMarkdownReport({ ...matrixOptions, showMatrixPage: false });
        expect(md).not.toContain("chapter-matrix");
        expect(md).not.toContain("| P \\ D |");
    });

    it("renders a milestone matrix with the milestone date as title", () => {
        const milestone = {
            scheduledAt: new Date("2025-06-01"),
            matrix: TEST_MATRIX,
            barGraph: null,
            active: true,
        };
        const md = generateMarkdownReport({
            ...matrixOptions,
            data: { ...report, milestones: [milestone] },
        });
        expect(md).toContain("**2025-06-01**");
    });
});
