import type { ProjectReport } from "#api/types/project.types.ts";
import type { RiskMatrix, Milestone } from "#application/hooks/use-report.hook.ts";
import { generateMarkdownReport } from "./report-md";

/**
 * Subset of the useReport hook return values required to generate and download
 * a markdown report. Matches the shape of the state in ReportPageBody so the
 * call site needs no transformation.
 */
interface MarkdownDownloadState {
    data: ProjectReport | null | undefined;
    filename: string;
    milestones: Milestone[] | null | undefined;
    threats: ProjectReport["threats"] | null | undefined;
    measures: ProjectReport["measures"] | null | undefined;
    bruttoMatrix: RiskMatrix | null | undefined;
    nettoMatrix: RiskMatrix | null | undefined;
    tillScheduledAt: string | null | undefined;
    showCoverPage?: boolean;
    showTableOfContentsPage?: boolean;
    showMethodExplanation?: boolean;
    showScaleExplanation?: boolean;
    showMatrixPage?: boolean;
    showAssetsPage?: boolean;
    showMeasuresPage?: boolean;
    showThreatListPage?: boolean;
    showThreatsPage?: boolean;
    systemImageOnSeperatePage?: boolean;
    language?: string;
}

/**
 * Assembles a markdown report from raw hook state and triggers a browser
 * file download. Returns early if data is not yet loaded.
 */
export function downloadMarkdownReport({
    data,
    filename,
    milestones,
    threats,
    measures,
    bruttoMatrix,
    nettoMatrix,
    tillScheduledAt,
    showCoverPage,
    showTableOfContentsPage,
    showMethodExplanation,
    showScaleExplanation,
    showMatrixPage,
    showAssetsPage,
    showMeasuresPage,
    showThreatListPage,
    showThreatsPage,
    systemImageOnSeperatePage,
    language,
}: MarkdownDownloadState): void {
    if (!data) {
        return;
    }
    const markdown = generateMarkdownReport({
        data: { ...data, milestones, threats: threats ?? [], measures: measures ?? [] },
        bruttoMatrix,
        nettoMatrix,
        tillScheduledAt,
        showCoverPage,
        showTableOfContentsPage,
        showMethodExplanation,
        showScaleExplanation,
        showMatrixPage,
        showAssetsPage,
        showMeasuresPage,
        showThreatListPage,
        showThreatsPage,
        systemImageOnSeperatePage,
        language,
    });
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
}
