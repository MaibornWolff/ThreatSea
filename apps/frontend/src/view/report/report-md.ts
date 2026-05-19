import type { ProjectReport } from "#api/types/project.types.ts";
import type { RiskMatrix, Milestone } from "#application/hooks/use-report.hook.ts";

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
}

// ---------------------------------------------------------------------------
// Static translations (English)
// The report i18n namespace is partially incomplete; we embed strings here
// so the markdown generator has no runtime i18n dependency.
// ---------------------------------------------------------------------------

const T = {
    coverPage: "Cover Page",
    tableOfContents: "Table of Contents",
    chapter: "Chapter",
    pagenumber: "Page",
    method: "The 4x6 Methodology",
    explanationIdea:
        "The 4x6 methodology is based on a matrix that specifies every conceivable threat from the four classes of attackers for any IT system abstracted to six classes of attack points.",
    explanationApplication:
        "The matrix is initially independent of specific attack techniques or attack targets. In the course of a threat analysis, this abstracted matrix is applied to a specific system architecture that was abstracted according to the above specification. From this, concrete attack scenarios are immediately developed in a manageable but nevertheless complete view.",
    attackersHeader: "Attackers",
    pointsOfAttackHeader: "Points Of Attack",
    explanationScale: "Explanation of Probability and Damage Scale",
    probability: "Probability",
    damage: "Damage",
    risk: "Risk",
    riskMatrices: "Risk Matrices",
    before: "Before",
    after: "After",
    gross: "gross",
    net: "net",
    systemImage: "System Image",
    assets: "Assets",
    measures: "Measures",
    riskList: "List of Threats",
    threats: "Threats",
    name: "Name",
    component: "Component",
    description: "Description",
    confidentiality: "Confidentiality",
    integrity: "Integrity",
    availability: "Availability",
    confidentialityJustification: "Confidentiality Justification",
    integrityJustification: "Integrity Justification",
    availabilityJustification: "Availability Justification",
    attacker: "Attacker",
    pointOfAttack: "Point of Attack",

    confidentialityLevels: {
        PUBLIC: "Public",
        INTERNAL: "Internal",
        CONFIDENTIAL: "Confidential",
        SECRET: "Secret",
    } as Record<string, string>,

    attackers: {
        UNAUTHORISED_PARTIES: {
            name: "Unauthorised Parties",
            description: "Entities with no tie to and especially no authorisation on the system under consideration",
        },
        SYSTEM_USERS: {
            name: "System Users",
            description:
                "Users being authorised to share use of resources with the application under consideration but not having authorisation on the application itself",
        },
        APPLICATION_USERS: {
            name: "Application Users",
            description: "Users being authorised to work with the application under consideration",
        },
        ADMINISTRATORS: {
            name: "(Technical) Administrators",
            description: "Users with elevated privileges who manage the infrastructure used by the application",
        },
    } as Record<string, { name: string; description: string }>,

    pointsOfAttacks: {
        USER_INTERFACE: {
            name: "User Interface",
            description:
                "the places and programmes, where and by which users interact with the system, usually via screen and input device, e.g. a browser on a PC",
        },
        PROCESSING_INFRASTRUCTURE: {
            name: "Processing Infrastructure",
            description:
                "places of program execution – in principle everything which has a processor and its programming is not absolutely fixed, e.g. including database servers, where queries are processed",
        },
        DATA_STORAGE_INFRASTRUCTURE: {
            name: "Data Storage Infrastructure",
            description: "places where data is stored durably – hard disks, non-volatile semiconductor memory, …",
        },
        COMMUNICATION_INFRASTRUCTURE: {
            name: "Communication Infrastructure",
            description: "physical transport of data via cable or wireless",
        },
        COMMUNICATION_INTERFACES: {
            name: "Communication Interfaces",
            description:
                "the connection to the means of communication on all OSI layers: network interfaces, wireless antenna, TCP Ports, APIs, …",
        },
        USER_BEHAVIOUR: {
            name: "User Behaviour",
            description: "The behaviour of a user (human)",
        },
    } as Record<string, { name: string; description: string }>,

    probabilities: [
        { name: "Very Unlikely", description: "The event is extremely rare and almost never expected to occur." },
        { name: "Unlikely", description: "The event is unusual and occurs only in exceptional circumstances." },
        { name: "Possible", description: "The event may occur under certain conditions." },
        { name: "Likely", description: "The event is expected to occur in many circumstances." },
        { name: "Very Likely", description: "The event is almost certain to occur." },
    ],

    // Valid cells of the 4x6 matrix keyed as cellNames[pointOfAttack][attacker]
    cellNames: {
        DATA_STORAGE_INFRASTRUCTURE: {
            UNAUTHORISED_PARTIES: "Physical data storage access",
            SYSTEM_USERS: "Internal breach on data storage",
            ADMINISTRATORS: "Privilege abuse on data storage",
        },
        PROCESSING_INFRASTRUCTURE: {
            UNAUTHORISED_PARTIES: "Physical attack on processing",
            SYSTEM_USERS: "Internal breach during processing",
            ADMINISTRATORS: "Privilege abuse on processing",
        },
        COMMUNICATION_INFRASTRUCTURE: {
            UNAUTHORISED_PARTIES: "Physical attack on transmission",
            SYSTEM_USERS: "Internal breach on transmission",
            ADMINISTRATORS: "Privilege abuse on transmission",
        },
        COMMUNICATION_INTERFACES: {
            UNAUTHORISED_PARTIES: "Physical interface attack",
            SYSTEM_USERS: "Breach via interface access",
            APPLICATION_USERS: "Detrimental interface usage",
        },
        USER_INTERFACE: {
            UNAUTHORISED_PARTIES: "Physical UI access",
            APPLICATION_USERS: "Detrimental UI usage",
        },
        USER_BEHAVIOUR: {
            UNAUTHORISED_PARTIES: "Deception",
        },
    } as Record<string, Record<string, string>>,

    damages: [
        { name: "Negligible", description: "Minimal impact; operations continue essentially unaffected." },
        { name: "Minor", description: "Limited impact; some disruption but quickly recoverable." },
        { name: "Moderate", description: "Significant impact; noticeable disruption or data exposure." },
        { name: "Major", description: "Severe impact; major disruption, large data breach, or financial loss." },
        { name: "Critical", description: "Catastrophic impact; organisation-wide damage or irreversible harm." },
    ],
};

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
        if (!row) continue;
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

function coverSection(data: ProjectReport, date: string, systemImageOnSeperatePage: boolean): string {
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
    }
    return lines.join("\n");
}

function systemImageSection(systemImage: string | null): string {
    const lines: string[] = [];
    lines.push(`## ${anchor("chapter-systemImage")}${T.systemImage}`);
    lines.push("");
    if (systemImage) {
        lines.push(`![${T.systemImage}](${systemImage})`);
    }
    return lines.join("\n");
}

function tableOfContentsSection(chapters: { label: string; id: string }[]): string {
    const lines: string[] = [];
    lines.push(`## ${T.tableOfContents}`);
    lines.push("");
    chapters.forEach((ch, i) => {
        lines.push(`${i + 1}. ${tocLink(ch.label, ch.id)}`);
    });
    return lines.join("\n");
}

function methodExplanationSection(): string {
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

function scaleExplanationSection(): string {
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

function assetsSection(assets: AssetWithReportId[]): string {
    const lines: string[] = [];
    lines.push(`## ${anchor("chapter-assetsDetails")}Assets`);
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

function measuresSection(measures: ReportMeasure[]): string {
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

function threatsListSection(threats: ThreatReport[]): string {
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

function threatsDetailSection(threats: ThreatReport[]): string {
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
            lines.push(`**Assets:**`);
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
    } = options;

    const hasSystemImage = Boolean(data.systemImage);

    // Build chapter list for table of contents
    const chapters: { label: string; id: string }[] = [];
    if (showMethodExplanation) chapters.push({ label: T.method, id: "chapter-methodExplanation" });
    if (showScaleExplanation) chapters.push({ label: T.explanationScale, id: "chapter-explanationScale" });
    if (systemImageOnSeperatePage && hasSystemImage) chapters.push({ label: T.systemImage, id: "chapter-systemImage" });
    if (showMatrixPage) chapters.push({ label: T.riskMatrices, id: "chapter-matrix" });
    if (showAssetsPage) chapters.push({ label: T.assets, id: "chapter-assetsDetails" });
    if (showMeasuresPage) chapters.push({ label: T.measures, id: "chapter-measuresDetails" });
    if (showThreatListPage) chapters.push({ label: T.riskList, id: "chapter-riskList" });
    if (showThreatsPage) chapters.push({ label: T.threats, id: "chapter-riskDetails" });

    const sections: string[] = [];

    if (showCoverPage) {
        sections.push(coverSection(data, date, systemImageOnSeperatePage));
    }

    if (showTableOfContentsPage && chapters.length > 0) {
        sections.push(tableOfContentsSection(chapters));
    }

    if (showMethodExplanation) {
        sections.push(methodExplanationSection());
    }

    if (showScaleExplanation) {
        sections.push(scaleExplanationSection());
    }

    if (systemImageOnSeperatePage && data.systemImage) {
        sections.push(systemImageSection(data.systemImage));
    }

    if (showMatrixPage) {
        sections.push(matrixSection(bruttoMatrix, nettoMatrix, tillScheduledAt, data.milestones));
    }

    if (showAssetsPage && data.assets.length > 0) {
        sections.push(assetsSection(data.assets));
    }

    if (showMeasuresPage && data.measures.length > 0) {
        sections.push(measuresSection(data.measures as ReportMeasure[]));
    }

    if (showThreatListPage && data.threats.length > 0) {
        sections.push(threatsListSection(data.threats));
    }

    if (showThreatsPage && data.threats.length > 0) {
        sections.push(threatsDetailSection(data.threats));
    }

    return sections.join(`\n${hr()}\n`);
}
