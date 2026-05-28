import { type ComponentProps, type FC } from "react";
import { Page as PdfPage, View, Image } from "@react-pdf/renderer";
import { SystemImage } from "#view/report/components/system-image.report.component.tsx";
import { styles, s3, s6, s2, s1 } from "#view/report/report.style.ts";
import { Text } from "#view/report/components/text.report.component.tsx";
import { useTranslation } from "react-i18next";
import { SystemImageLegend } from "#view/report/components/system-image-legend.report.compoent.tsx";
import type { IndexCallback, ProjectReport } from "#api/types/project.types.ts";

type PdfPageProps = Omit<ComponentProps<typeof PdfPage>, "children">;

interface CoverPageProps extends ProjectReport, PdfPageProps {
    indexCallback: IndexCallback;
    systemImageOnSeparatePage?: boolean;
    logo: string | undefined;
    companyLogo: string | undefined;
    date: string;
    language: string;
}

export const CoverPage: FC<CoverPageProps> = ({
    indexCallback,
    systemImageOnSeparatePage = false,
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
            {!systemImageOnSeparatePage && (
                <View>
                    <SystemImage src={systemImage} style={{ marginTop: s6 }} />
                    <SystemImageLegend language={language} style={{ marginTop: s1 }} />
                </View>
            )}
        </PdfPage>
    );
};
