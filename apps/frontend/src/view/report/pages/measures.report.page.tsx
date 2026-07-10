import { type ReactNode } from "react";
import { Link, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { useTranslation } from "react-i18next";
import { Page } from "#view/report/components/page.report.component.tsx";
import { measureCardFitsOnOnePage } from "#view/report/pages/report-card-page-fit.ts";
import { Text } from "#view/report/components/text.report.component.tsx";
import { backgroundColor, s1 } from "#view/report/report.style.ts";
import type { IndexCallback, ProjectReport } from "#api/types/project.types.ts";
import { colors } from "#view/wrappers/color-tokens.ts";

type ReportMeasure = Omit<ProjectReport["measures"][number], "scheduledAt"> & {
    scheduledAt: string | Date;
    reportId?: string;
};

type MeasureThreat = ReportMeasure["threats"][number];

interface MeasuresDetailsPageProps {
    indexCallback: IndexCallback;
    language: string;
    project: ProjectReport["project"];
    logo?: string;
    date: string;
    measures: ReportMeasure[];
}

interface MeasureCardProps extends ReportMeasure {
    language: string;
}

interface DescriptionProps {
    style?: Style;
    children: ReactNode;
    language: string;
}

interface ThreatsListProps {
    threats: MeasureThreat[];
    language: string;
}

const buildMeasureGroups = (measures: ReportMeasure[]): ReportMeasure[][] => {
    if (measures.length === 0) {
        return [[]];
    }
    const groups: ReportMeasure[][] = [];
    let current: ReportMeasure[] = [];
    for (const measure of measures) {
        if (measureCardFitsOnOnePage(measure)) {
            current.push(measure);
        } else {
            if (current.length > 0) {
                groups.push(current);
                current = [];
            }
            groups.push([measure]);
        }
    }
    if (current.length > 0) {
        groups.push(current);
    }
    return groups;
};

export const MeasuresDetailsPage = ({
    indexCallback,
    language,
    project,
    logo,
    date,
    measures,
}: MeasuresDetailsPageProps) => {
    const linkId = "measuresDetails";
    const { t } = useTranslation("report", { lng: language });
    const groups = buildMeasureGroups(measures);
    const pageProps = {
        logo,
        projectName: project.name,
        date,
        confidentialityLevel: t("confidentialityLevels." + project.confidentialityLevel),
    };
    return (
        <>
            {groups.map((group, groupIdx) => (
                <Page key={groupIdx} {...pageProps}>
                    {groupIdx === 0 && (
                        <>
                            <View
                                render={({ pageNumber }) => {
                                    indexCallback(pageNumber, t("measures"), linkId);
                                    return null;
                                }}
                            />
                            <Text id={`chapter-${linkId}`} size="header" style={{ marginBottom: s1 }}>
                                {t("measures")}
                            </Text>
                        </>
                    )}
                    {group.map((measure) => (
                        <MeasureCard key={measure.id} language={language} {...measure} />
                    ))}
                </Page>
            ))}
        </>
    );
};

const MeasureCard = ({ language, reportId, id, name, description, scheduledAt, threats }: MeasureCardProps) => {
    const scheduledAtDate = typeof scheduledAt === "string" ? new Date(scheduledAt) : new Date(scheduledAt.getTime());
    const fitsOnOnePage = measureCardFitsOnOnePage({ name, description, threats });
    return (
        <View
            id={`measure-${reportId}`}
            wrap={!fitsOnOnePage}
            style={{
                backgroundColor,
                padding: s1,
                marginBottom: s1,
                borderRadius: 10,
            }}
        >
            <View
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                    backgroundColor: colors.surface.paperWhite,
                    borderRadius: 10,
                    padding: s1,
                }}
            >
                <Text style={{ fontWeight: 600 }}>
                    {reportId} {name}
                </Text>
                <View
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                    }}
                >
                    <Text
                        style={{
                            marginRight: s1,
                            fontSize: 8,
                            fontStyle: "italic",
                        }}
                    >
                        ID: {id}
                    </Text>
                </View>
                <Text
                    size="small"
                    style={{
                        fontStyle: "italic",
                    }}
                >
                    {scheduledAtDate.toISOString().split("T")[0]}
                </Text>
                <View
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginTop: s1,
                    }}
                >
                    {description.length > 0 && (
                        <Description style={{ flex: 1 }} language={language}>
                            {description}
                        </Description>
                    )}
                </View>
                {threats && threats.length > 0 && (
                    <View
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            marginTop: s1,
                        }}
                    >
                        <ThreatsList threats={threats} language={language} />
                    </View>
                )}
            </View>
        </View>
    );
};

const Description = ({ style, children, language }: DescriptionProps) => {
    const { t } = useTranslation("report", { lng: language });
    return (
        <View
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                ...(style ?? {}),
            }}
        >
            <Text size="small" style={{ fontWeight: 600 }}>
                {t("description")}
            </Text>
            <Text size="small">{children}</Text>
        </View>
    );
};

const ThreatsList = ({ threats, language }: ThreatsListProps) => {
    const { t } = useTranslation("report", { lng: language });
    return (
        <View>
            <Text size="small" style={{ fontWeight: 600 }}>
                {t("threats")}
            </Text>
            {threats.map((threat, j) => (
                <Link
                    key={threat.id}
                    src={`#threat-${threat.reportId}`}
                    style={{
                        textDecoration: "none",
                    }}
                >
                    <Text
                        size="small"
                        key={j}
                        style={{
                            marginTop: s1 / 4,
                        }}
                    >
                        {threat.id} {threat.name}
                    </Text>
                </Link>
            ))}
        </View>
    );
};
