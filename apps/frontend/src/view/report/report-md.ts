import type { ProjectReport } from "#api/types/project.types.ts";
import type { RiskMatrix, Milestone } from "#application/hooks/use-report.hook.ts";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import { POA_COLORS } from "../colors/pointsOfAttack.colors";
import i18next from "i18next";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ThreatReport = ProjectReport["threats"][number];
type ReportMeasure = Omit<ProjectReport["measures"][number], "scheduledAt"> & {
    scheduledAt: string | Date;
    reportId?: string;
};
type AssetWithReportId = ProjectReport["assets"][number];

export interface MarkdownReportOptions {
    data: ProjectReport & { milestones?: Milestone[] | null };
    bruttoMatrix?: RiskMatrix | null;
    nettoMatrix?: RiskMatrix | null;
    date?: string;
    tillScheduledAt?: string | null;
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
}

function buildTranslations(language: string): Translations {
    const t = i18next.getFixedT(language, "report");

    const poaKeys = [
        "DATA_STORAGE_INFRASTRUCTURE",
        "PROCESSING_INFRASTRUCTURE",
        "COMMUNICATION_INFRASTRUCTURE",
        "COMMUNICATION_INTERFACES",
        "USER_INTERFACE",
        "USER_BEHAVIOUR",
    ];
    const attackerKeys = ["UNAUTHORISED_PARTIES", "SYSTEM_USERS", "APPLICATION_USERS", "ADMINISTRATORS"];

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
    };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hr(): string {
    return "\n---\n";
}

function anchor(id: string): string {
    return `<a id="${id}"></a>`;
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

function measureAnchorId(reportId: string): string {
    return `measure-${reportId}`;
}

function renderMatrix(matrix: RiskMatrix, title: string): string {
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
    lines.push(
        "*G = green (low risk), Y = yellow (medium risk), R = red (high risk). Count shown when threats present.*"
    );
    return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Section generators
// ---------------------------------------------------------------------------

function coverSection(T: Translations, data: ProjectReport, date: string, systemImageOnSeperatePage: boolean): string {
    const { project, systemImage } = data;
    const confidentialityLabel = T.confidentialityLevels[project.confidentialityLevel] ?? project.confidentialityLevel;

    const lines: string[] = [];
    lines.push(`# ${project.name}`);
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
        lines.push(project.description);
    }
    if (!systemImageOnSeperatePage && systemImage) {
        lines.push("");
        lines.push(`![${T.systemImage}](${systemImage})`);
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
        lines.push(`![${T.systemImage}](${systemImage})`);
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
        lines.push(renderMatrix(bruttoMatrix, T.before));
        lines.push("");
    }
    if (nettoMatrix) {
        lines.push(renderMatrix(nettoMatrix, T.after));
        lines.push("");
    }

    const activeMilestones = milestones?.filter((m) => m.active);
    if (activeMilestones && activeMilestones.length > 0) {
        activeMilestones.forEach((milestone) => {
            if (milestone.matrix) {
                const title = milestone.scheduledAt.toISOString().split("T")[0];
                lines.push(renderMatrix(milestone.matrix, title ?? ""));
                lines.push("");
            }
        });
    }

    return lines.join("\n");
}

function assetsSection(T: Translations, assets: AssetWithReportId[]): string {
    const lines: string[] = [];
    lines.push(`## ${anchor("chapter-assetsDetails")}${T.assets}`);
    lines.push("");

    assets.forEach((asset) => {
        const id = `asset-${asset.reportId}`;
        lines.push(`### ${anchor(id)}${asset.reportId} ${asset.name}`);
        lines.push("");
        lines.push(`*ID: ${asset.id}*`);
        lines.push("");
        lines.push(`| ${T.confidentiality} | ${T.integrity} | ${T.availability} |`);
        lines.push(`|---|---|---|`);
        lines.push(`| ${asset.confidentiality} | ${asset.integrity} | ${asset.availability} |`);
        lines.push("");

        if (asset.description) {
            lines.push(`**${T.description}:** ${asset.description}`);
            lines.push("");
        }
        if (asset.confidentialityJustification) {
            lines.push(`**${T.confidentialityJustification}:** ${asset.confidentialityJustification}`);
            lines.push("");
        }
        if (asset.integrityJustification) {
            lines.push(`**${T.integrityJustification}:** ${asset.integrityJustification}`);
            lines.push("");
        }
        if (asset.availabilityJustification) {
            lines.push(`**${T.availabilityJustification}:** ${asset.availabilityJustification}`);
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
        const rid = measure.reportId ?? String(measure.id);
        const id = `measure-${rid}`;
        lines.push(`### ${anchor(id)}${rid} ${measure.name}`);
        lines.push("");
        lines.push(`*ID: ${measure.id}*`);
        lines.push("");

        const scheduledAtDate =
            typeof measure.scheduledAt === "string"
                ? new Date(measure.scheduledAt)
                : new Date(measure.scheduledAt.getTime());
        lines.push(`*${scheduledAtDate.toISOString().split("T")[0]}*`);
        lines.push("");

        if (measure.description && measure.description.length > 0) {
            lines.push(`**${T.description}:** ${measure.description}`);
            lines.push("");
        }

        if (measure.threats && measure.threats.length > 0) {
            lines.push(`**${T.threats}:**`);
            lines.push("");
            measure.threats.forEach((threat) => {
                const threatRid = threat.reportId ?? String(threat.id);
                const link = `[${threat.id} ${threat.name ?? ""}](#${threatAnchorId(threatRid)})`;
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
        const link = `[${threat.name}](#${threatAnchorId(threat.reportId)})`;
        const component = threat.componentName ?? "";
        lines.push(`| ${threat.id} | ${link} | ${component} |`);
    });
    lines.push("");

    return lines.join("\n");
}

function threatsDetailSection(T: Translations, threats: ThreatReport[]): string {
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

        lines.push(`### ${anchor(id)}${threat.reportId} ${threat.name}`);
        lines.push("");
        lines.push(`*ID: ${threat.id}*`);
        lines.push("");

        if (affectedGoals) {
            lines.push(`*${affectedGoals}*`);
            lines.push("");
        }

        // Risk table
        lines.push(`| | ${T.probability} | ${T.damage} | ${T.risk} |`);
        lines.push(`|---|---|---|---|`);
        lines.push(`| ${T.gross} | ${threat.probability} | ${threat.damage} | ${threat.risk} |`);
        lines.push(`| ${T.net} | ${threat.netProbability} | ${threat.netDamage} | ${threat.netRisk} |`);
        lines.push("");

        lines.push(`**${T.component}:** ${threat.componentName ?? "–"}`);
        lines.push("");
        lines.push(`**${T.attackersHeader}:** ${attackerName}`);
        lines.push("");
        lines.push(`**${T.pointsOfAttackHeader}:** ${poaName}`);
        lines.push("");

        if (threat.description) {
            lines.push(`**${T.description}:** ${threat.description}`);
            lines.push("");
        }

        if (threat.assets && threat.assets.length > 0) {
            lines.push(`**${T.assets}:**`);
            lines.push("");
            threat.assets.forEach((asset) => {
                const assetRid = asset.reportId ?? String(asset.id);
                const link = `[${assetRid} ${asset.name ?? ""}](#${assetAnchorId(assetRid)})`;
                lines.push(`- ${link}`);
            });
            lines.push("");
        }

        if (threat.measures && threat.measures.length > 0) {
            lines.push(`**${T.measures}:**`);
            lines.push("");
            threat.measures.forEach((measure) => {
                const mRid = measure.reportId ?? String(measure.measureId);
                const link = `[${mRid} ${measure.name ?? ""}](#${measureAnchorId(mRid)})`;
                lines.push(`- ${link}`);
                if (measure.description) {
                    lines.push(`  *${measure.description}*`);
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
        showAssetsPage = true,
        showMeasuresPage = true,
        showThreatListPage = true,
        showThreatsPage = true,
        systemImageOnSeperatePage = false,
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
    if (systemImageOnSeperatePage && hasSystemImage) {
        chapters.push({ label: T.systemImage, id: "chapter-systemImage" });
    }
    if (showMatrixPage) {
        chapters.push({ label: T.riskMatrices, id: "chapter-matrix" });
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
        sections.push(coverSection(T, data, date, systemImageOnSeperatePage));
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

    if (systemImageOnSeperatePage && data.systemImage) {
        sections.push(systemImageSection(T, data.systemImage));
    }

    if (showMatrixPage) {
        sections.push(matrixSection(T, bruttoMatrix, nettoMatrix, tillScheduledAt, data.milestones));
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
        sections.push(threatsDetailSection(T, data.threats));
    }

    return sections.join(`\n${hr()}\n`);
}
