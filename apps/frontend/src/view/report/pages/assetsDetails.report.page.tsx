import type { ReactNode } from "react";
import { View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import type { Asset } from "#api/types/asset.types.ts";
import type { IndexCallback, Project } from "#api/types/project.types.ts";
import { backgroundColor, s1 } from "../report.style";
import { Page } from "../components/page.report.component";
import { useTranslation } from "react-i18next";
import { Text } from "../components/text.report.component";

type AssetWithReportId = Asset & { reportId: string };

interface AssetsDetailsPageProps {
    indexCallback: IndexCallback;
    language: string;
    project: Project;
    logo?: string;
    date: string;
    assets: AssetWithReportId[];
}

interface AssetCardProps extends AssetWithReportId {
    language: string;
}

interface HeaderProps {
    reportId: string;
    id: number;
    name: string;
    language: string;
    confidentiality: number;
    integrity: number;
    availability: number;
}

interface DescriptionProps {
    style?: Style;
    language: string;
    children: ReactNode;
}

interface JustificationsProps {
    language: string;
    confidentialityJustification: string;
    integrityJustification: string;
    availabilityJustification: string;
}

export const AssetsDetailsPage = ({ indexCallback, language, project, logo, date, assets }: AssetsDetailsPageProps) => {
    const linkId = "assetsDetails";
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
                    indexCallback(pageNumber, t("assets"), linkId);
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
                Assets
            </Text>
            {assets.map((asset, i) => {
                return <AssetCard key={i} language={language} {...asset} />;
            })}
        </Page>
    );
};

const AssetCard = ({
    name,
    id,
    description,
    confidentiality,
    confidentialityJustification,
    integrity,
    integrityJustification,
    availability,
    availabilityJustification,
    language,
    reportId,
}: AssetCardProps) => {
    return (
        <View
            id={reportId}
            wrap={false}
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
                    backgroundColor: "#fff",
                    borderRadius: 10,
                    padding: s1,
                }}
            >
                <Header
                    reportId={reportId}
                    id={id}
                    name={name}
                    language={language}
                    confidentiality={confidentiality}
                    integrity={integrity}
                    availability={availability}
                />
                {description && (
                    <View
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            marginTop: s1,
                        }}
                    >
                        <Description style={{ flex: 1 }} language={language}>
                            {description}
                        </Description>
                    </View>
                )}

                <View
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                    }}
                >
                    <Justifications
                        language={language}
                        confidentialityJustification={confidentialityJustification}
                        integrityJustification={integrityJustification}
                        availabilityJustification={availabilityJustification}
                    />
                </View>
            </View>
        </View>
    );
};

const Header = ({ reportId, id, name, language, confidentiality, integrity, availability }: HeaderProps) => {
    const { t } = useTranslation("report", { lng: language });
    return (
        <View
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                marginRight: s1,
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
            <View
                style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                }}
            >
                <View
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                    }}
                >
                    <Text size="small" style={{ fontWeight: 600 }}>
                        {t("confidentiality")}:
                    </Text>
                    <Text
                        size="small"
                        style={{
                            flex: 1,
                            marginLeft: s1,
                        }}
                    >
                        {confidentiality}
                    </Text>
                </View>
                <View
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                    }}
                >
                    <Text size="small" style={{ fontWeight: 600 }}>
                        {t("integrity")}:
                    </Text>
                    <Text size="small" style={{ flex: 1, marginLeft: s1 }}>
                        {integrity}
                    </Text>
                </View>
                <View
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                    }}
                >
                    <Text size="small" style={{ fontWeight: 600 }}>
                        {t("availability")}:
                    </Text>
                    <Text
                        size="small"
                        style={{
                            flex: 1,
                            marginLeft: s1,
                        }}
                    >
                        {availability}
                    </Text>
                </View>
            </View>
        </View>
    );
};

const Description = ({ style, language, children }: DescriptionProps) => {
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
                {t("description")}:
            </Text>
            <Text size="small">{children}</Text>
        </View>
    );
};

const Justifications = ({
    language,
    confidentialityJustification,
    integrityJustification,
    availabilityJustification,
}: JustificationsProps) => {
    const { t } = useTranslation("report", { lng: language });
    return (
        <>
            <View
                style={{
                    display: "flex",
                    flexDirection: "column",
                    marginTop: s1,
                    gap: s1,
                }}
            >
                {confidentialityJustification && (
                    <View
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "stretch",
                        }}
                    >
                        <Text size="small" style={{ fontWeight: 600, marginTop: s1 }}>
                            {t("confidentialityJustification")}:
                        </Text>
                        <Text size="small">{confidentialityJustification}</Text>
                    </View>
                )}

                {integrityJustification && (
                    <View
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "stretch",
                        }}
                    >
                        <Text size="small" style={{ fontWeight: 600 }}>
                            {t("integrityJustification")}:
                        </Text>
                        <Text size="small">{integrityJustification}</Text>
                    </View>
                )}

                {availabilityJustification && (
                    <View
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "stretch",
                        }}
                    >
                        <Text size="small" style={{ fontWeight: 600 }}>
                            {t("availabilityJustification")}:
                        </Text>
                        <Text size="small">{availabilityJustification}</Text>
                    </View>
                )}
            </View>
        </>
    );
};
