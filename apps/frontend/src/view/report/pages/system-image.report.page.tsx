import type { FC } from "react";
import { Page } from "../components/page.report.component";
import { SystemImage } from "../components/system-image.report.component";
import { SystemImageLegend } from "../components/system-image-legend.report.compoent";
import { Text } from "../components/text.report.component";
import { s1 } from "../report.style";
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
