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
    return (
        <Page
            logo={logo}
            projectName={project.name}
            date={date}
            confidentialityLevel={t("confidentialityLevels." + project.confidentialityLevel)}
        >
            <View
                render={({ pageNumber }) => {
                    indexCallback(pageNumber, t("components"), linkId);
                    return null;
                }}
            />
            <Text
                id={`chapter-${linkId}`}
                size="header"
                style={{
                    marginBottom: s1,
                }}
            >
                {t("components")}
            </Text>
            {components.map((component, i) => {
                return <ComponentCard key={i} language={language} {...component} />;
            })}
        </Page>
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
