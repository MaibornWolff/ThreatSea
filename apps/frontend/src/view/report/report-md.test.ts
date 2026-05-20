import "#utils/translations.ts"; // initialises i18next with all namespaces as a side effect
import { generateMarkdownReport, type MarkdownReportOptions } from "#view/report/report-md.ts";
import type { ProjectReport } from "#api/types/project.types.ts";
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
