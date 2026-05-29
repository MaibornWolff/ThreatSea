import type { FC } from "react";
import { Page } from "#view/report/components/page.report.component.tsx";
import { SystemImage } from "#view/report/components/system-image.report.component.tsx";
import { SystemImageLegend } from "#view/report/components/system-image-legend.report.compoent.tsx";
import { Text } from "#view/report/components/text.report.component.tsx";
import { s1 } from "#view/report/report.style.ts";
import { useTranslation } from "react-i18next";
import { View } from "@react-pdf/renderer";
import type { IndexCallback, ProjectReport } from "#api/types/project.types.ts";

interface SystemImagePageProps {
    indexCallback: IndexCallback;
    language: string;
    systemImage: ProjectReport["systemImage"];
    project: ProjectReport["project"];
    logo?: string;
    date: string;
}

export const SystemImagePage: FC<SystemImagePageProps> = ({
    indexCallback,
    language,
    systemImage,
    project,
    logo,
    date,
}) => {
    const linkId = "systemImage";
    const { t } = useTranslation("report", { lng: language });
    return (
        <Page
            orientation="landscape"
            logo={logo}
            projectName={project.name}
            date={date}
            confidentialityLevel={t("confidentialityLevels." + project.confidentialityLevel)}
        >
            <View
                render={({ pageNumber }) => {
                    indexCallback(pageNumber, t("systemImage"), linkId);
                    return null;
                }}
            />
            <Text
                id={`chapter-${linkId}`}
                style={{
                    paddingBottom: s1,
                }}
            >
                {t("systemImage")}
            </Text>
            <SystemImage src={systemImage} />
            <SystemImageLegend language={language} style={{ marginTop: s1 }} />
        </Page>
    );
};
