import React, { type ComponentProps } from "react";
import { Page as PdfPage, View, Image } from "@react-pdf/renderer";
import { SystemImage } from "../components/system-image.report.component";
import { styles, s3, s6, s2, s1 } from "../report.style";
import { Text } from "../components/text.report.component";
import { useTranslation } from "react-i18next";
import { SystemImageLegend } from "../components/system-image-legend.report.compoent";
import type { IndexCallback, ProjectReport } from "#api/types/project.types.ts";

type PdfPageProps = Omit<ComponentProps<typeof PdfPage>, "children">;

interface CoverPageProps extends ProjectReport, PdfPageProps {
    indexCallback: IndexCallback;
    systemImageOnSeperatePage?: boolean;
    logo: string | undefined;
    companyLogo: string | undefined;
    date: string;
    language: string;
}

export const CoverPage: React.FC<CoverPageProps> = ({
    indexCallback,
    systemImageOnSeperatePage = false,
    systemImage,
    logo,
    companyLogo,
    project,
    date,
    language,
    ...props
}) => {
    const { t } = useTranslation("report", { lng: language });
    return (
        <PdfPage size="A4" style={styles.coverPage} {...props}>
            <View
                id="chapter-cover"
                render={({ pageNumber }) => {
                    indexCallback(pageNumber, t("coverPage"), "cover");
                    return null;
                }}
            />
            <View
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <Text
                    style={{
                        paddingTop: s6,
                    }}
                >
                    {project.name}
                </Text>
                <Text>Cyber Security | MaibornWolff</Text>
                <Text
                    size="small"
                    style={{
                        paddingTop: s2,
                        fontWeight: "bold",
                    }}
                >
                    {date}
                </Text>
                <Text style={{ fontStyle: "italic" }}>
                    {t("confidentialityLevels." + project.confidentialityLevel)}
                </Text>
                <View
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingTop: s2,
                    }}
                >
                    <Image style={{ width: 80, height: "auto" }} src={logo} />
                    <Text style={{ padding: s2 }}>by</Text>
                    <View style={{ paddingRight: 20 }}>
                        <Image style={{ width: 60, height: "auto" }} src={companyLogo} />
                    </View>
                </View>
                <Text
                    size="small"
                    style={{
                        paddingTop: s3,
                        textAlign: "center",
                    }}
                >
                    {project?.description}
                </Text>
            </View>
            {!systemImageOnSeperatePage && (
                <View>
                    <SystemImage src={systemImage} style={{ marginTop: s6 }} />
                    <SystemImageLegend language={language} style={{ marginTop: s1 }} />
                </View>
            )}
        </PdfPage>
    );
};
