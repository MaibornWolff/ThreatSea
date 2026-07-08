import { type ReactNode } from "react";
import { Link, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { s1, fontColor, backgroundColor, s2, s4 } from "#view/report/report.style.ts";
import { Page } from "#view/report/components/page.report.component.tsx";
import { threatCardFitsOnOnePage } from "#view/report/pages/threat-card-page-fit.ts";
import { useTranslation } from "react-i18next";
import { Text } from "#view/report/components/text.report.component.tsx";
import { MATRIX_COLOR } from "#view/colors/matrix.ts";
import type { MatrixColorKey } from "#view/colors/matrix.ts";
import type { IndexCallback, ProjectReport, ThreatReport } from "#api/types/project.types.ts";
import { colors } from "#view/wrappers/color-tokens.ts";

type ReportThreat = ProjectReport["threats"][number];
type ThreatAsset = ReportThreat["assets"][number];
type ThreatMeasure = ReportThreat["measures"][number];

interface ThreatsDetailsPageProps {
    indexCallback: IndexCallback;
    language: string;
    project: ProjectReport["project"];
    logo: string | undefined;
    date: string;
    threats: ThreatReport[];
    showComponentsPage: boolean;
    showAssetsPage: boolean;
    showMeasuresPage: boolean;
}

interface ThreatCardProps extends ThreatReport {
    language: string;
    showComponentsPage: boolean;
    showAssetsPage: boolean;
    showMeasuresPage: boolean;
}

interface RiskInfoProps {
    language: string;
    bruttoColor: MatrixColorKey;
    nettoColor: MatrixColorKey;
    damage: number;
    probability: number;
    risk: number;
    netDamage: number;
    netProbability: number;
    netRisk: number;
}

interface HeaderProps {
    language: string;
    reportId: string;
    id: number;
    name: string;
    confidentiality: boolean;
    integrity: boolean;
    availability: boolean;
}

interface InformationsProps {
    componentName: ReportThreat["componentName"];
    componentReportId: ReportThreat["componentReportId"];
    showComponentsPage: boolean;
    attacker: ReportThreat["attacker"];
    pointOfAttack: ReportThreat["pointOfAttack"];
    language: string;
}

interface DescriptionProps {
    style?: Style;
    children: ReactNode;
    language: string;
}

interface AssetsListProps {
    assets: ThreatAsset[];
    showAssetsPage: boolean;
}

interface MeasuresListProps {
    measures: ThreatMeasure[];
    style?: Style;
    language: string;
    showMeasuresPage: boolean;
}

export const ThreatsDetailsPage = ({
    indexCallback,
    language,
    project,
    logo,
    date,
    threats,
    showComponentsPage,
    showAssetsPage,
    showMeasuresPage,
}: ThreatsDetailsPageProps) => {
    const linkId = "riskDetails";
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
                    indexCallback(pageNumber, t("threats"), linkId);
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
                {t("threats")}
            </Text>
            {threats.map((threat, i) => {
                return (
                    <ThreatCard
                        key={i}
                        language={language}
                        showComponentsPage={showComponentsPage}
                        showAssetsPage={showAssetsPage}
                        showMeasuresPage={showMeasuresPage}
                        {...threat}
                    />
                );
            })}
        </Page>
    );
};

const ThreatCard = ({
    reportId,
    id,
    name,
    description,
    confidentiality,
    integrity,
    availability,
    measures,
    assets,
    componentName,
    componentReportId,
    attacker,
    pointOfAttack,
    language,
    showComponentsPage,
    showAssetsPage,
    showMeasuresPage,
    bruttoColor,
    nettoColor,
    damage,
    probability,
    risk,
    netDamage,
    netProbability,
    netRisk,
    ...props
}: ThreatCardProps) => {
    const fitsOnOnePage = threatCardFitsOnOnePage({ description, assets, measures });
    return (
        <View
            id={`threat-${reportId}`}
            // Keep a card that fits on a page together, otherwise allow it to break across pages
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
                    backgroundColor: colors.surface.paperWhite,
                    borderRadius: 10,
                    padding: s1,
                }}
            >
                <View
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginTop: s1,
                        marginBottom: s4,
                    }}
                >
                    <Header
                        language={language}
                        reportId={reportId}
                        id={id}
                        name={name}
                        confidentiality={confidentiality}
                        integrity={integrity}
                        availability={availability}
                    />
                    <RiskInfo
                        language={language}
                        bruttoColor={bruttoColor}
                        nettoColor={nettoColor}
                        damage={damage}
                        probability={probability}
                        risk={risk}
                        netDamage={netDamage}
                        netProbability={netProbability}
                        netRisk={netRisk}
                    />
                </View>
                <View
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginTop: s1,
                    }}
                >
                    <View
                        style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "stretch",
                        }}
                    >
                        <Informations
                            componentName={componentName}
                            componentReportId={componentReportId}
                            showComponentsPage={showComponentsPage}
                            attacker={attacker}
                            pointOfAttack={pointOfAttack}
                            {...props}
                            language={language}
                        />
                        <AssetsList assets={assets} showAssetsPage={showAssetsPage} />
                    </View>
                    <Description style={{ flex: 1, marginLeft: s1 }} language={language}>
                        {description}
                    </Description>
                </View>
                {measures && measures.length > 0 && (
                    <MeasuresList
                        measures={measures}
                        language={language}
                        showMeasuresPage={showMeasuresPage}
                        style={{ marginTop: s1 }}
                    />
                )}
            </View>
        </View>
    );
};

const RiskInfo = ({
    language,
    bruttoColor,
    nettoColor,
    damage,
    probability,
    risk,
    netDamage,
    netProbability,
    netRisk,
}: RiskInfoProps) => {
    const { t } = useTranslation("report", { lng: language });
    return (
        <View
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
            }}
        >
            <View
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "flex-end",
                }}
            >
                <Text size="small" style={{ width: 60, textAlign: "center", fontSize: 8 }}>
                    {t("probability")}
                </Text>
                <Text size="small" style={{ width: 60, textAlign: "center", fontSize: 8 }}>
                    {t("damage")}
                </Text>
                <Text size="small" style={{ width: 60, textAlign: "center", fontSize: 8 }}>
                    {t("risk")}
                </Text>
            </View>
            <View
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                }}
            >
                <View
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        paddingTop: s1,
                        paddingBottom: s1,
                        borderRadius: 10,
                        backgroundColor: MATRIX_COLOR[bruttoColor]?.light,
                    }}
                >
                    <Text size="small" style={{ width: 60, textAlign: "center" }}>
                        {probability}
                    </Text>
                    <Text size="small" style={{ width: 60, textAlign: "center" }}>
                        {damage}
                    </Text>
                    <View
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 60,
                        }}
                    >
                        <Text size="small">{risk}</Text>
                        <Text
                            style={{
                                paddingLeft: 2,
                                fontSize: 8,
                            }}
                        >
                            ({t("gross")})
                        </Text>
                    </View>
                </View>
                <View
                    style={{
                        height: 1,
                        width: "100%",
                        backgroundColor: colors.surface.paperWhite,
                        marginTop: s1 / 2,
                        marginBottom: s1 / 2,
                    }}
                ></View>
                <View
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        paddingTop: s1,
                        paddingBottom: s1,
                        borderRadius: 10,
                        backgroundColor: MATRIX_COLOR[nettoColor]?.light,
                    }}
                >
                    <Text size="small" style={{ width: 60, textAlign: "center" }}>
                        {netProbability}
                    </Text>
                    <Text size="small" style={{ width: 60, textAlign: "center" }}>
                        {netDamage}
                    </Text>
                    <View
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 60,
                        }}
                    >
                        <Text size="small">{netRisk}</Text>
                        <Text
                            style={{
                                paddingLeft: 2,
                                fontSize: 8,
                            }}
                        >
                            ({t("net")})
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

const Header = ({ language, reportId, id, name, confidentiality, integrity, availability }: HeaderProps) => {
    const { t } = useTranslation("report", { lng: language });
    return (
        <View
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
            }}
        >
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
                    }}
                >
                    {reportId}
                </Text>
                <Text style={{ fontWeight: 600, maxWidth: 250 }}>{name}</Text>
            </View>
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
                    alignItems: "center",
                    marginTop: 2,
                }}
            >
                <Text
                    size="small"
                    style={{
                        color: confidentiality ? fontColor : backgroundColor,
                    }}
                >
                    {t("confidentiality")}
                </Text>
                <Text
                    size="small"
                    style={{
                        color: integrity ? fontColor : backgroundColor,
                        marginLeft: s1,
                    }}
                >
                    {t("integrity")}
                </Text>
                <Text
                    size="small"
                    style={{
                        color: availability ? fontColor : backgroundColor,
                        marginLeft: s1,
                    }}
                >
                    {t("availability")}
                </Text>
            </View>
        </View>
    );
};

const Informations = ({
    componentName,
    componentReportId,
    showComponentsPage,
    attacker,
    pointOfAttack,
    language,
}: InformationsProps) => {
    const { t } = useTranslation("report", { lng: language });
    return (
        <View
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                marginBottom: s2,
            }}
        >
            <Text size="small" style={{ fontWeight: 600 }}>
                {t("component")}
            </Text>
            {componentReportId && showComponentsPage ? (
                <Link src={`#${componentReportId}`} style={{ textDecoration: "none" }}>
                    <Text size="small" style={{ marginLeft: s2 }}>
                        {componentReportId} {componentName}
                    </Text>
                </Link>
            ) : (
                <Text size="small" style={{ marginLeft: s2 }}>
                    {componentName}
                </Text>
            )}
            <Text size="small" style={{ fontWeight: 600 }}>
                {t("attackersHeader")}
            </Text>
            <Text size="small" style={{ marginLeft: s2 }}>
                {t("attackers." + attacker + ".name")}
            </Text>
            <Text size="small" style={{ fontWeight: 600 }}>
                {t("pointsOfAttackHeader")}
            </Text>
            <Text size="small" style={{ marginLeft: s2 }}>
                {t("pointsOfAttacks." + pointOfAttack + ".name")}
            </Text>
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
                ...style,
            }}
        >
            <Text size="small" style={{ fontWeight: 600 }}>
                {t("description")}
            </Text>
            <Text size="small">{children}</Text>
        </View>
    );
};

const AssetsList = ({ assets, showAssetsPage }: AssetsListProps) => {
    return (
        <View>
            <Text size="small" style={{ fontWeight: 600 }}>
                Assets
            </Text>
            {assets.map((asset, j) => {
                const label = (
                    <Text size="small" key={j} style={{ marginTop: s1 / 4 }}>
                        {asset.reportId} {asset.name}
                    </Text>
                );
                return showAssetsPage ? (
                    <Link key={asset.id} src={`#${asset.reportId}`} style={{ textDecoration: "none" }}>
                        {label}
                    </Link>
                ) : (
                    <View key={asset.id}>{label}</View>
                );
            })}
        </View>
    );
};

const MeasuresList = ({ measures, style, language, showMeasuresPage }: MeasuresListProps) => {
    const { t } = useTranslation("report", { lng: language });
    return (
        <View {...style}>
            <Text size="small" style={{ fontWeight: 600 }}>
                {t("measures")}
            </Text>
            {measures.map((measure, i) => {
                const { reportId, name, description } = measure;
                const label = (
                    <Text size="small" style={{ marginTop: s1 / 4 }}>
                        {`${reportId} ${name}`}
                    </Text>
                );
                return (
                    <View
                        key={i}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            marginTop: s1 / 2,
                        }}
                    >
                        {showMeasuresPage ? (
                            <Link style={{ color: fontColor, textDecoration: "none" }} src={`#measure-${reportId}`}>
                                {label}
                            </Link>
                        ) : (
                            label
                        )}
                        <Text size="small" style={{ marginLeft: s2, fontStyle: "italic" }}>
                            {description}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
};
