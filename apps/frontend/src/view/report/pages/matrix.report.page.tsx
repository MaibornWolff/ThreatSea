import { View } from "@react-pdf/renderer";
import { Page } from "../components/page.report.component";
import { Text } from "../components/text.report.component";
import { useTranslation } from "react-i18next";
import { Matrix } from "../components/matrix.report.component";
import { s1, s2, backgroundColor } from "../report.style";
import type { IndexCallback, ProjectReport } from "#api/types/project.types.ts";
import type { Milestone, RiskMatrix } from "#application/hooks/use-report.hook.ts";

type ProjectDataProps = Partial<ProjectReport> & { project: ProjectReport["project"] };

interface MatrixPageProps extends ProjectDataProps {
    indexCallback: IndexCallback;
    language: string;
    tillScheduledAt: string | null | undefined;
    bruttoMatrix: RiskMatrix | null;
    nettoMatrix: RiskMatrix | null;
    logo?: string;
    date: string;
    milestones?: Milestone[] | null;
}

export const MatrixPage = ({
    indexCallback,
    language,
    tillScheduledAt,
    bruttoMatrix,
    nettoMatrix,
    project,
    logo,
    date,
    milestones,
}: MatrixPageProps) => {
    const linkId = "matrix";
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
                    indexCallback(pageNumber, t("riskMatrices"), linkId);
                    return null;
                }}
            />
            <View>
                <Text
                    id={`chapter-${linkId}`}
                    size="header"
                    style={{
                        marginBottom: s1,
                    }}
                >
                    {t("riskMatrices")}
                </Text>
                {tillScheduledAt && (
                    <View>
                        <Text
                            size="small"
                            style={{
                                marginBottom: s1,
                            }}
                        >
                            Start - {new Date(tillScheduledAt).toISOString().split("T")[0]}
                        </Text>
                    </View>
                )}
            </View>
            <View
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: s2,
                    borderRadius: 10,
                    backgroundColor,
                }}
            >
                <Matrix language={language} title={t("before")} data={bruttoMatrix} />
                <Matrix language={language} title={t("after")} data={nettoMatrix} />
            </View>
            <View
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                }}
            >
                {milestones
                    ?.filter((m) => m.active)
                    .map((milestone, i) => {
                        const { matrix, scheduledAt } = milestone;
                        return (
                            <Matrix
                                language={language}
                                key={i}
                                title={scheduledAt.toISOString().split("T")[0]}
                                data={matrix}
                                style={{ marginTop: s1 }}
                            />
                        );
                    })}
            </View>
        </Page>
    );
};
