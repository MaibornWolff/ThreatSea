import type { ProjectReport } from "#api/types/project.types.ts";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import { ATTACKERS } from "#api/types/attackers.types.ts";
import { POA_COLORS } from "#view/colors/pointsOfAttack.colors.ts";
import i18next from "i18next";
import type { Milestone, RiskMatrix } from "#utils/report-risk.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ThreatReport = ProjectReport["threats"][number];
type ReportMeasure = Omit<ProjectReport["measures"][number], "scheduledAt"> & {
    scheduledAt: string | Date;
    reportId?: string;
};
type AssetWithReportId = ProjectReport["assets"][number];
type ComponentWithReportId = ProjectReport["components"][number];

export interface MarkdownReportOptions {
    data: ProjectReport & { milestones?: Milestone[] | null | undefined };
    bruttoMatrix?: RiskMatrix | null | undefined;
    nettoMatrix?: RiskMatrix | null | undefined;
    date?: string | undefined;
    tillScheduledAt?: string | null | undefined;
    showCoverPage?: boolean | undefined;
    showTableOfContentsPage?: boolean | undefined;
    showMethodExplanation?: boolean | undefined;
    showScaleExplanation?: boolean | undefined;
    showMatrixPage?: boolean | undefined;
    showComponentsPage?: boolean | undefined;
    showAssetsPage?: boolean | undefined;
    showMeasuresPage?: boolean | undefined;
    showThreatListPage?: boolean | undefined;
    showThreatsPage?: boolean | undefined;
    systemImageOnSeparatePage?: boolean | undefined;
    language?: string | undefined;
}

// ---------------------------------------------------------------------------
// Translations
// ---------------------------------------------------------------------------

interface Translations {
    coverPage: string;
    tableOfContents: string;
    chapter: string;
    pagenumber: string;
    method: string;
    explanationIdea: string;
    explanationApplication: string;
    attackersHeader: string;
    pointsOfAttackHeader: string;
    explanationScale: string;
    probability: string;
    damage: string;
    risk: string;
    riskMatrices: string;
    before: string;
    after: string;
    gross: string;
    net: string;
    systemImage: string;
    assets: string;
    measures: string;
    riskList: string;
    threats: string;
    name: string;
    component: string;
    components: string;
    description: string;
    confidentiality: string;
    integrity: string;
    availability: string;
    confidentialityJustification: string;
    integrityJustification: string;
    availabilityJustification: string;
    attacker: string;
    pointOfAttack: string;
    confidentialityLevels: Record<string, string>;
    attackers: Record<string, { name: string; description: string }>;
    pointsOfAttacks: Record<string, { name: string; description: string }>;
    probabilities: { name: string; description: string }[];
    cellNames: Record<string, Record<string, string>>;
    damages: { name: string; description: string }[];
    matrixLegend: string;
    matrixAxisLegend: string;
}

function buildTranslations(language: string): Translations {
    const t = i18next.getFixedT(language, "report");

    const poaKeys = Object.values(POINTS_OF_ATTACK);
    const attackerKeys = Object.values(ATTACKERS);

    const cellNames: Record<string, Record<string, string>> = {};
    for (const poa of poaKeys) {
        cellNames[poa] = {};
        for (const attacker of attackerKeys) {
            const key = `${poa}.${attacker}.name`;
            const val = t(key);
            if (val !== key) {
                cellNames[poa]![attacker] = val;
            }
        }
    }

    return {
        coverPage: t("coverPage"),
        tableOfContents: t("tableOfContents"),
        chapter: t("chapter"),
        pagenumber: t("pagenumber"),
        method: t("method"),
        explanationIdea: t("explanationIdea"),
        explanationApplication: t("explanationApplication"),
        attackersHeader: t("attackersHeader"),
        pointsOfAttackHeader: t("pointsOfAttackHeader"),
        explanationScale: t("explanationScale"),
        probability: t("probability"),
        damage: t("damage"),
        risk: t("risk"),
        riskMatrices: t("riskMatrices"),
        before: t("before"),
        after: t("after"),
        gross: t("gross"),
        net: t("net"),
        systemImage: t("systemImage"),
        assets: t("assets"),
        measures: t("measures"),
        riskList: t("riskList"),
        threats: t("threats"),
        name: t("name"),
        component: t("component"),
        components: t("components"),
        description: t("description"),
        confidentiality: t("confidentiality"),
        integrity: t("integrity"),
        availability: t("availability"),
        confidentialityJustification: t("confidentialityJustification"),
        integrityJustification: t("integrityJustification"),
        availabilityJustification: t("availabilityJustification"),
        attacker: t("attacker"),
        pointOfAttack: t("pointOfAttack"),
        confidentialityLevels: t("confidentialityLevels", { returnObjects: true }) as Record<string, string>,
        attackers: t("attackers", { returnObjects: true }) as Record<string, { name: string; description: string }>,
        pointsOfAttacks: t("pointsOfAttacks", { returnObjects: true }) as Record<
            string,
            { name: string; description: string }
        >,
        probabilities: Object.values(
            t("probabilities", { returnObjects: true }) as Record<string, { name: string; description: string }>
        ),
        cellNames,
        damages: Object.values(
            t("damages", { returnObjects: true }) as Record<string, { name: string; description: string }>
        ),
        matrixLegend: t("matrixLegend"),
        matrixAxisLegend: t("matrixAxisLegend"),
    };
}

// ---------------------------------------------------------------------------
// Sanitization helpers
// ---------------------------------------------------------------------------

/**
 * Strip line breaks from user content used in single-line contexts: headings,
 * table cells, link text, and inline emphasis. A newline in a heading or table
 * cell terminates the element and the remainder can introduce new structure
 * (e.g. `\n# Injected heading`).
 */
function escapeInline(s: string): string {
    return s.replace(/[\r\n]+/g, " ");
}

/**
 * Escape pipe characters that would split a table cell, on top of stripping
 * line breaks.
 */
function escapeCell(s: string): string {
    return escapeInline(s).replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
}

/**
 * Escape closing square brackets that would prematurely end link text and
 * allow an attacker-controlled URL to follow, on top of stripping line breaks.
 */
function escapeLinkText(s: string): string {
    return escapeInline(s).replace(/\\/g, "\\\\").replace(/\]/g, "\\]");
}

/**
 * Percent-encode parentheses in URLs. A bare `)` ends the `(url)` part of a
 * Markdown link, so user-supplied URLs must have it encoded.
 */
function escapeUrl(url: string): string {
    return url.replace(/\(/g, "%28").replace(/\)/g, "%29");
}

/**
 * For multi-line block text (e.g. project/asset descriptions) preserve the
 * original line breaks but escape leading `#` so lines cannot become ATX
 * headings, which would alter the document outline.
 *
 * Single newlines are converted to Markdown hard line breaks (two trailing
 * spaces + newline) so they render as `<br>` rather than being merged into
 * the surrounding paragraph. Double newlines (paragraph breaks) are kept
 * intact.
 */
function escapeBlock(s: string): string {
    return (
        s
            .replace(/\r\n?/g, "\n")
            // ATX headings: `# heading` AND bare `###` (no trailing space/content)
            .replace(/^(#{1,6})(?=[ \t]|$)/gm, "\\$1")
            // Setext heading underlines and thematic breaks:
            // lines consisting solely of -, =, *, _ (plus optional spaces/tabs)
            .replace(/^([-=*_])[-=*_ \t]*$/gm, "\\$&")
            // Fenced code blocks: ``` or ~~~ at line start swallow all following
            // content (including headings) until a matching closing fence
            .replace(/^(`{3,}|~{3,})/gm, "\\$1")
            // HTML blocks: CommonMark treats lines starting with < as raw HTML;
            // \< is a valid backslash escape that renders as a literal <
            .replace(/^</gm, "\\<")
            // Hard line breaks: single \n → two trailing spaces + \n
            .replace(/([^\n])\n(?!\n)/g, "$1  \n")
    );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hr(): string {
    return "\n---\n";
}

function anchor(id: string): string {
    // Strip characters that could break out of the HTML attribute value.
    const safeId = id.replace(/["<>]/g, "");
    return `<a id="${safeId}"></a>`;
}

function tocLink(label: string, id: string): string {
    return `[${label}](#${id})`;
}

function threatAnchorId(reportId: string): string {
    return `threat-${reportId}`;
}

function assetAnchorId(reportId: string): string {
    return `asset-${reportId}`;
}

function componentAnchorId(reportId: string): string {
    return `component-${reportId}`;
}

function measureAnchorId(reportId: string): string {
    return `measure-${reportId}`;
}

function renderMatrix(T: Translations, matrix: RiskMatrix, title: string): string {
    const lines: string[] = [];
    lines.push(`**${title}**\n`);

    // Header row: damage 1–5
    const header = `| P \\ D | D1 | D2 | D3 | D4 | D5 |`;
    const separator = `|--------|----|----|----|----|-----|`;
    lines.push(header);
    lines.push(separator);

    for (let y = 0; y < matrix.length; y++) {
        const row = matrix[y];
        if (!row) {
            continue;
        }
        const prob = 5 - y; // probability label (5 at top, 1 at bottom)
        const cells = row
            .map((cell) => {
                const colorLabel = cell.color === "green" ? "G" : cell.color === "yellow" ? "Y" : "R";
                const count = typeof cell.amount === "number" ? String(cell.amount) : " ";
                return `${colorLabel}${count !== " " ? `:${count}` : ""}`;
            })
            .join(" | ");
        lines.push(`| P${prob} | ${cells} |`);
    }

    lines.push("");
    lines.push(`*${T.matrixAxisLegend}*`);
    lines.push(`*${T.matrixLegend}*`);
    return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Section generators
// ---------------------------------------------------------------------------

function coverSection(T: Translations, data: ProjectReport, date: string, systemImageOnSeparatePage: boolean): string {
    const { project, systemImage } = data;
    const confidentialityLabel = T.confidentialityLevels[project.confidentialityLevel] ?? project.confidentialityLevel;

    const lines: string[] = [];
    lines.push(`# ${escapeInline(project.name)}`);
    lines.push("");
    lines.push("Cyber Security | MaibornWolff");
    lines.push("");
    lines.push("ThreatSea by MaibornWolff");
    lines.push("");
    lines.push(`**${date}**`);
    lines.push("");
    lines.push(`*${confidentialityLabel}*`);
    if (project.description) {
        lines.push("");
        lines.push(escapeBlock(project.description));
    }
    if (!systemImageOnSeparatePage && systemImage) {
        lines.push("");
        lines.push(`![${T.systemImage}](${escapeUrl(systemImage)})`);
        lines.push("");
        lines.push(systemImageLegend(T));
    }
    return lines.join("\n");
}

function systemImageLegend(T: Translations): string {
    const lines: string[] = [];
    lines.push(`| | ${T.pointsOfAttackHeader} |`);
    lines.push(`|:---:|---|`);
    for (const poa of Object.values(POINTS_OF_ATTACK)) {
        const color = POA_COLORS[poa].normal;
        const name = T.pointsOfAttacks[poa]?.name ?? poa;
        const swatch = `<svg width="12" height="12" xmlns="http://www.w3.org/2000/svg"><rect width="12" height="12" fill="${color}" rx="2"/></svg>`;
        lines.push(`| ${swatch} \`${color}\` | ${name} |`);
    }
    return lines.join("\n");
}

function systemImageSection(T: Translations, systemImage: string | null): string {
    const lines: string[] = [];
    lines.push(`## ${anchor("chapter-systemImage")}${T.systemImage}`);
    lines.push("");
    if (systemImage) {
        lines.push(`![${T.systemImage}](${escapeUrl(systemImage)})`);
        lines.push("");
    }
    lines.push(systemImageLegend(T));
    return lines.join("\n");
}

function tableOfContentsSection(T: Translations, chapters: { label: string; id: string }[]): string {
    const lines: string[] = [];
    lines.push(`## ${T.tableOfContents}`);
    lines.push("");
    chapters.forEach((ch, i) => {
        lines.push(`${i + 1}. ${tocLink(ch.label, ch.id)}`);
    });
    return lines.join("\n");
}

function methodExplanationSection(T: Translations): string {
    const lines: string[] = [];
    lines.push(`## ${anchor("chapter-methodExplanation")}${T.method}`);
    lines.push("");
    lines.push(T.explanationIdea);
    lines.push("");

    // 4x6 matrix (static, attackers × points of attack)
    const attackerKeys = Object.keys(T.attackers);
    const poaKeys = Object.keys(T.pointsOfAttacks);
    const attackerNames = attackerKeys.map((k) => T.attackers[k]?.name ?? k);
    const poaNames = poaKeys.map((k) => T.pointsOfAttacks[k]?.name ?? k);

    // Table header
    const header = `| | ${attackerNames.join(" | ")} |`;
    const sep = `|---|${"---|".repeat(attackerNames.length)}`;
    lines.push(header);
    lines.push(sep);
    poaKeys.forEach((poaKey, i) => {
        const poaName = poaNames[i] ?? poaKey;
        const cells = attackerKeys.map((attackerKey) => T.cellNames[poaKey]?.[attackerKey] ?? "");
        lines.push(`| ${poaName} | ${cells.join(" | ")} |`);
    });
    lines.push("");

    lines.push(`**${T.attackersHeader}:**`);
    lines.push("");
    Object.values(T.attackers).forEach((attacker) => {
        lines.push(`- **${attacker.name}:** ${attacker.description}`);
    });
    lines.push("");

    lines.push(`**${T.pointsOfAttackHeader}:**`);
    lines.push("");
    Object.values(T.pointsOfAttacks).forEach((poa) => {
        lines.push(`- **${poa.name}:** ${poa.description}`);
    });
    lines.push("");

    lines.push(T.explanationApplication);
    return lines.join("\n");
}

function scaleExplanationSection(T: Translations): string {
    const lines: string[] = [];
    lines.push(`## ${anchor("chapter-explanationScale")}${T.explanationScale}`);
    lines.push("");

    lines.push(`**${T.probability}**`);
    lines.push("");
    T.probabilities.forEach((p, i) => {
        lines.push(`**${i + 1} – ${p.name}**`);
        lines.push("");
        lines.push(p.description);
        lines.push("");
    });

    lines.push(`**${T.damage}**`);
    lines.push("");
    T.damages.forEach((d, i) => {
        lines.push(`**${i + 1} – ${d.name}**`);
        lines.push("");
        lines.push(d.description);
        lines.push("");
    });

    return lines.join("\n");
}

function matrixSection(
    T: Translations,
    bruttoMatrix: RiskMatrix | null | undefined,
    nettoMatrix: RiskMatrix | null | undefined,
    tillScheduledAt: string | null | undefined,
    milestones: Milestone[] | null | undefined
): string {
    const lines: string[] = [];
    lines.push(`## ${anchor("chapter-matrix")}${T.riskMatrices}`);
    lines.push("");

    if (tillScheduledAt) {
        const dateStr = new Date(tillScheduledAt).toISOString().split("T")[0];
        lines.push(`*Start – ${dateStr}*`);
        lines.push("");
    }

    if (bruttoMatrix) {
        lines.push(renderMatrix(T, bruttoMatrix, T.before));
        lines.push("");
    }
    if (nettoMatrix) {
        lines.push(renderMatrix(T, nettoMatrix, T.after));
        lines.push("");
    }

    const activeMilestones = milestones?.filter((m) => m.active);
    if (activeMilestones && activeMilestones.length > 0) {
        activeMilestones.forEach((milestone) => {
            if (milestone.matrix) {
                const title = milestone.scheduledAt.toISOString().split("T")[0];
                lines.push(renderMatrix(T, milestone.matrix, title ?? ""));
                lines.push("");
            }
        });
    }

    return lines.join("\n");
}

function componentsSection(T: Translations, components: ComponentWithReportId[]): string {
    const lines: string[] = [];
    lines.push(`## ${anchor("chapter-componentsDetails")}${T.components}`);
    lines.push("");

    components.forEach((component) => {
        lines.push(
            `### ${anchor(componentAnchorId(component.reportId))}${escapeInline(component.reportId)} ${escapeInline(component.name)}`
        );
        lines.push("");

        if (component.description) {
            lines.push(`**${T.description}:**`);
            lines.push("");
            lines.push(escapeBlock(component.description));
            lines.push("");
        }
    });

    return lines.join("\n");
}

function assetsSection(T: Translations, assets: AssetWithReportId[]): string {
    const lines: string[] = [];
    lines.push(`## ${anchor("chapter-assetsDetails")}${T.assets}`);
    lines.push("");

    assets.forEach((asset) => {
        const id = `asset-${asset.reportId}`;
        lines.push(`### ${anchor(id)}${escapeInline(asset.reportId)} ${escapeInline(asset.name)}`);
        lines.push("");
        lines.push(`*ID: ${escapeInline(String(asset.id))}*`);
        lines.push("");
        lines.push(`| ${T.confidentiality} | ${T.integrity} | ${T.availability} |`);
        lines.push(`|---|---|---|`);
        lines.push(
            `| ${escapeCell(String(asset.confidentiality))} | ${escapeCell(String(asset.integrity))} | ${escapeCell(String(asset.availability))} |`
        );
        lines.push("");

        if (asset.description) {
            lines.push(`**${T.description}:**`);
            lines.push("");
            lines.push(escapeBlock(asset.description));
            lines.push("");
        }
        if (asset.confidentialityJustification) {
            lines.push(`**${T.confidentialityJustification}:**`);
            lines.push("");
            lines.push(escapeBlock(asset.confidentialityJustification));
            lines.push("");
        }
        if (asset.integrityJustification) {
            lines.push(`**${T.integrityJustification}:**`);
            lines.push("");
            lines.push(escapeBlock(asset.integrityJustification));
            lines.push("");
        }
        if (asset.availabilityJustification) {
            lines.push(`**${T.availabilityJustification}:**`);
            lines.push("");
            lines.push(escapeBlock(asset.availabilityJustification));
            lines.push("");
        }
    });

    return lines.join("\n");
}

function measuresSection(T: Translations, measures: ReportMeasure[]): string {
    const lines: string[] = [];
    lines.push(`## ${anchor("chapter-measuresDetails")}${T.measures}`);
    lines.push("");

    measures.forEach((measure) => {
        const rid = escapeInline(measure.reportId ?? String(measure.id));
        const id = `measure-${rid}`;
        lines.push(`### ${anchor(id)}${rid} ${escapeInline(measure.name)}`);
        lines.push("");
        lines.push(`*ID: ${escapeInline(String(measure.id))}*`);
        lines.push("");

        const scheduledAtDate =
            typeof measure.scheduledAt === "string"
                ? new Date(measure.scheduledAt)
                : new Date(measure.scheduledAt.getTime());
        lines.push(`*${scheduledAtDate.toISOString().split("T")[0]}*`);
        lines.push("");

        if (measure.description && measure.description.length > 0) {
            lines.push(`**${T.description}:**`);
            lines.push("");
            lines.push(escapeBlock(measure.description));
            lines.push("");
        }

        if (measure.threats && measure.threats.length > 0) {
            lines.push(`**${T.threats}:**`);
            lines.push("");
            measure.threats.forEach((threat) => {
                const threatRid = threat.reportId ?? String(threat.id);
                const linkText = escapeLinkText(`${threat.id} ${threat.name ?? ""}`);
                const link = `[${linkText}](#${threatAnchorId(threatRid)})`;
                lines.push(`- ${link}`);
            });
            lines.push("");
        }
    });

    return lines.join("\n");
}

function threatsListSection(T: Translations, threats: ThreatReport[]): string {
    const lines: string[] = [];
    lines.push(`## ${anchor("chapter-riskList")}${T.riskList}`);
    lines.push("");

    lines.push(`| ID | ${T.name} | ${T.component} |`);
    lines.push(`|----|---------|-----------|`);
    threats.forEach((threat) => {
        const link = `[${escapeLinkText(threat.name)}](#${threatAnchorId(threat.reportId)})`;
        const component = escapeCell(threat.componentName ?? "");
        lines.push(`| ${escapeCell(String(threat.id))} | ${link} | ${component} |`);
    });
    lines.push("");

    return lines.join("\n");
}

interface ThreatLinkOptions {
    linkComponents: boolean;
    linkAssets: boolean;
    linkMeasures: boolean;
}

function threatsDetailSection(T: Translations, threats: ThreatReport[], linkOptions: ThreatLinkOptions): string {
    const lines: string[] = [];
    lines.push(`## ${anchor("chapter-riskDetails")}${T.threats}`);
    lines.push("");

    threats.forEach((threat) => {
        const id = threatAnchorId(threat.reportId);
        const attackerName = T.attackers[threat.attacker]?.name ?? threat.attacker;
        const poaName = T.pointsOfAttacks[threat.pointOfAttack]?.name ?? threat.pointOfAttack;
        const affectedGoals = [
            threat.confidentiality && T.confidentiality,
            threat.integrity && T.integrity,
            threat.availability && T.availability,
        ]
            .filter(Boolean)
            .join(", ");

        lines.push(`### ${anchor(id)}${escapeInline(threat.reportId)} ${escapeInline(threat.name)}`);
        lines.push("");
        lines.push(`*ID: ${escapeInline(String(threat.id))}*`);
        lines.push("");

        if (affectedGoals) {
            lines.push(`*${affectedGoals}*`);
            lines.push("");
        }

        // Risk table
        lines.push(`| | ${T.probability} | ${T.damage} | ${T.risk} |`);
        lines.push(`|---|---|---|---|`);
        lines.push(
            `| ${T.gross} | ${escapeCell(String(threat.probability))} | ${escapeCell(String(threat.damage))} | ${escapeCell(String(threat.risk))} |`
        );
        lines.push(
            `| ${T.net} | ${escapeCell(String(threat.netProbability))} | ${escapeCell(String(threat.netDamage))} | ${escapeCell(String(threat.netRisk))} |`
        );
        lines.push("");

        if (threat.componentReportId && linkOptions.linkComponents) {
            const componentLinkText = escapeLinkText(`${threat.componentReportId} ${threat.componentName ?? ""}`);
            const componentLink = `[${componentLinkText}](#${componentAnchorId(threat.componentReportId)})`;
            lines.push(`**${T.component}:** ${componentLink}`);
        } else {
            lines.push(`**${T.component}:** ${escapeInline(threat.componentName ?? "–")}`);
        }
        lines.push("");
        lines.push(`**${T.attackersHeader}:** ${attackerName}`);
        lines.push("");
        lines.push(`**${T.pointsOfAttackHeader}:** ${poaName}`);
        lines.push("");

        if (threat.description) {
            lines.push(`**${T.description}:**`);
            lines.push("");
            lines.push(escapeBlock(threat.description));
            lines.push("");
        }

        if (threat.assets && threat.assets.length > 0) {
            lines.push(`**${T.assets}:**`);
            lines.push("");
            threat.assets.forEach((asset) => {
                const assetRid = asset.reportId ?? String(asset.id);
                const label = `${assetRid} ${asset.name ?? ""}`;
                if (linkOptions.linkAssets) {
                    lines.push(`- [${escapeLinkText(label)}](#${assetAnchorId(assetRid)})`);
                } else {
                    lines.push(`- ${escapeInline(label)}`);
                }
            });
            lines.push("");
        }

        if (threat.measures && threat.measures.length > 0) {
            lines.push(`**${T.measures}:**`);
            lines.push("");
            threat.measures.forEach((measure) => {
                const mRid = measure.reportId ?? String(measure.measureId);
                const label = `${mRid} ${measure.name ?? ""}`;
                const rendered = linkOptions.linkMeasures
                    ? `[${escapeLinkText(label)}](#${measureAnchorId(mRid)})`
                    : escapeInline(label);
                if (measure.description) {
                    lines.push(`- ${rendered}<br>*${escapeInline(measure.description)}*`);
                } else {
                    lines.push(`- ${rendered}`);
                }
            });
            lines.push("");
        }
    });

    return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function generateMarkdownReport(options: MarkdownReportOptions): string {
    const {
        data,
        bruttoMatrix,
        nettoMatrix,
        date = new Date().toISOString().split("T")[0]!,
        tillScheduledAt,
        showCoverPage = true,
        showTableOfContentsPage = true,
        showMethodExplanation = true,
        showScaleExplanation = true,
        showMatrixPage = true,
        showComponentsPage = true,
        showAssetsPage = true,
        showMeasuresPage = true,
        showThreatListPage = true,
        showThreatsPage = true,
        systemImageOnSeparatePage = false,
        language = "en",
    } = options;

    const T = buildTranslations(language);

    const hasSystemImage = Boolean(data.systemImage);

    // Build chapter list for table of contents
    const chapters: { label: string; id: string }[] = [];
    if (showMethodExplanation) {
        chapters.push({ label: T.method, id: "chapter-methodExplanation" });
    }
    if (showScaleExplanation) {
        chapters.push({ label: T.explanationScale, id: "chapter-explanationScale" });
    }
    if (systemImageOnSeparatePage && hasSystemImage) {
        chapters.push({ label: T.systemImage, id: "chapter-systemImage" });
    }
    if (showMatrixPage) {
        chapters.push({ label: T.riskMatrices, id: "chapter-matrix" });
    }
    if (showComponentsPage) {
        chapters.push({ label: T.components, id: "chapter-componentsDetails" });
    }
    if (showAssetsPage) {
        chapters.push({ label: T.assets, id: "chapter-assetsDetails" });
    }
    if (showMeasuresPage) {
        chapters.push({ label: T.measures, id: "chapter-measuresDetails" });
    }
    if (showThreatListPage) {
        chapters.push({ label: T.riskList, id: "chapter-riskList" });
    }
    if (showThreatsPage) {
        chapters.push({ label: T.threats, id: "chapter-riskDetails" });
    }

    const sections: string[] = [];

    if (showCoverPage) {
        sections.push(coverSection(T, data, date, systemImageOnSeparatePage));
    }

    if (showTableOfContentsPage && chapters.length > 0) {
        sections.push(tableOfContentsSection(T, chapters));
    }

    if (showMethodExplanation) {
        sections.push(methodExplanationSection(T));
    }

    if (showScaleExplanation) {
        sections.push(scaleExplanationSection(T));
    }

    if (systemImageOnSeparatePage && data.systemImage) {
        sections.push(systemImageSection(T, data.systemImage));
    }

    if (showMatrixPage) {
        sections.push(matrixSection(T, bruttoMatrix, nettoMatrix, tillScheduledAt, data.milestones));
    }

    if (showComponentsPage && data.components.length > 0) {
        sections.push(componentsSection(T, data.components));
    }

    if (showAssetsPage && data.assets.length > 0) {
        sections.push(assetsSection(T, data.assets));
    }

    if (showMeasuresPage && data.measures.length > 0) {
        sections.push(measuresSection(T, data.measures as ReportMeasure[]));
    }

    if (showThreatListPage && data.threats.length > 0) {
        sections.push(threatsListSection(T, data.threats));
    }

    if (showThreatsPage && data.threats.length > 0) {
        sections.push(
            threatsDetailSection(T, data.threats, {
                linkComponents: showComponentsPage && data.components.length > 0,
                linkAssets: showAssetsPage && data.assets.length > 0,
                linkMeasures: showMeasuresPage && data.measures.length > 0,
            })
        );
    }

    return sections.join(`\n${hr()}\n`);
}
