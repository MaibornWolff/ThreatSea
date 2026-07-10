import { View } from "@react-pdf/renderer";
import type { IndexCallback, Project, ProjectReport } from "#api/types/project.types.ts";
import { backgroundColor, s1 } from "#view/report/report.style.ts";
import { Page } from "#view/report/components/page.report.component.tsx";
import { componentCardFitsOnOnePage } from "#view/report/pages/report-card-page-fit.ts";
import { useTranslation } from "react-i18next";
import { Text } from "#view/report/components/text.report.component.tsx";
import { colors } from "#view/wrappers/color-tokens.ts";

type ComponentWithReportId = ProjectReport["components"][number];

interface ComponentsDetailsPageProps {
    indexCallback: IndexCallback;
    language: string;
    project: Project;
    logo?: string;
    date: string;
    components: ComponentWithReportId[];
}

interface ComponentCardProps extends ComponentWithReportId {
    language: string;
}

const buildComponentGroups = (components: ComponentWithReportId[]): ComponentWithReportId[][] => {
    if (components.length === 0) {
        return [[]];
    }
    const groups: ComponentWithReportId[][] = [];
    let current: ComponentWithReportId[] = [];
    for (const component of components) {
        if (componentCardFitsOnOnePage(component)) {
            current.push(component);
        } else {
            if (current.length > 0) {
                groups.push(current);
                current = [];
            }
            groups.push([component]);
        }
    }
    if (current.length > 0) {
        groups.push(current);
    }
    return groups;
};

export const ComponentsDetailsPage = ({
    indexCallback,
    language,
    project,
    logo,
    date,
    components,
}: ComponentsDetailsPageProps) => {
    const linkId = "componentsDetails";
    const { t } = useTranslation("report", { lng: language });
    const groups = buildComponentGroups(components);
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
                                    indexCallback(pageNumber, t("components"), linkId);
                                    return null;
                                }}
                            />
                            <Text id={`chapter-${linkId}`} size="header" style={{ marginBottom: s1 }}>
                                {t("components")}
                            </Text>
                        </>
                    )}
                    {group.map((component) => (
                        <ComponentCard key={component.reportId} language={language} {...component} />
                    ))}
                </Page>
            ))}
        </>
    );
};

const ComponentCard = ({ name, description, reportId, language }: ComponentCardProps) => {
    const { t } = useTranslation("report", { lng: language });
    const fitsOnOnePage = componentCardFitsOnOnePage({ name, description });
    return (
        <View
            id={reportId}
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
                {description && (
                    <View
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "stretch",
                            marginTop: s1,
                        }}
                    >
                        <Text size="small" style={{ fontWeight: 600 }}>
                            {t("description")}:
                        </Text>
                        <Text size="small">{description}</Text>
                    </View>
                )}
            </View>
        </View>
    );
};
