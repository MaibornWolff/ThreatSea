import { View, Link } from "@react-pdf/renderer";
import { Page } from "../components/page.report.component";
import { Text } from "../components/text.report.component";
import { useTranslation } from "react-i18next";
import { s1, backgroundColor, s5 } from "../report.style";
import { MATRIX_COLOR } from "../../colors/matrix";
import type { MatrixColorKey } from "../../colors/matrix";
import type { IndexCallback, ProjectReport, ThreatReport } from "#api/types/project.types.ts";

interface ThreatsListPageProps {
    indexCallback: IndexCallback;
    threats: ThreatReport[];
    project: ProjectReport["project"];
    logo: string | undefined;
    language: string;
    date: string;
}

interface IndexThreatRowProps {
    reportId: string;
    id: number;
    name: string;
    componentName: string | null;
    nettoColor: MatrixColorKey;
    number: number;
}

export const ThreatsListPage = ({ indexCallback, threats, project, logo, language, date }: ThreatsListPageProps) => {
    const linkId = "riskList";
    const { t } = useTranslation("report", {
        lng: language,
    });
    return (
        <Page
            logo={logo}
            projectName={project.name}
            date={date}
            confidentialityLevel={t("confidentialityLevels." + project.confidentialityLevel)}
        >
            <View
                render={({ pageNumber }) => {
                    indexCallback(pageNumber, t("riskList"), linkId);
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
                {t("riskList")}
            </Text>
            <View
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                    backgroundColor: backgroundColor,
                    borderRadius: 10,
                }}
            >
                <View
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <Text size="small" style={{ width: s5, padding: s1 }}>
                        ID
                    </Text>
                    <Text size="small" style={{ flex: 4, padding: s1, paddingLeft: s1 + 2 }}>
                        {t("name")}
                    </Text>
                    <Text size="small" style={{ flex: 2, padding: s1, paddingLeft: s1 + 2 }}>
                        {t("component")}
                    </Text>
                </View>
                <View
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        backgroundColor: "#fff",
                    }}
                >
                    {threats.map((threat, i) => {
                        const number = i + 1;
                        return <IndexThreatRow key={i} number={number} {...threat} />;
                    })}
                </View>
                <View
                    style={{
                        height: 30,
                        width: "100%",
                        borderTop: "2px solid #fff",
                    }}
                ></View>
            </View>
        </Page>
    );
};

const IndexThreatRow = ({ reportId, id, name, componentName, nettoColor }: IndexThreatRowProps) => {
    return (
        <Link
            src={`#threat-${reportId}`}
            style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "stretch",
                justifyContent: "space-between",
                textDecoration: "none",
                borderTop: "2px solid #fff",
                backgroundColor: MATRIX_COLOR[nettoColor].light,
            }}
            wrap={false}
        >
            <View
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    padding: s1,
                }}
            >
                <Text
                    size="small"
                    style={{
                        textAlign: "left",
                        width: 25,
                    }}
                >
                    {id}
                </Text>
            </View>
            <View
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 4,
                    padding: s1,
                    borderLeft: "2px solid #fff",
                }}
            >
                <Text size="small">{name}</Text>
            </View>
            <View
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 2,
                    padding: s1,
                    borderLeft: "2px solid #fff",
                }}
            >
                <Text size="small">{componentName}</Text>
            </View>
        </Link>
    );
};
