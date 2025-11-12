import { View } from "@react-pdf/renderer";
import { s1, s2 } from "../report.style";
import { Page } from "../components/page.report.component";
import { useTranslation } from "react-i18next";
import { Text } from "../components/text.report.component";
import { ThreatMatrix } from "../components/threatMatrix.report.component";
import type { IndexCallback, ProjectReport } from "#api/types/project.types.ts";

interface MethodExplanationPageProps {
    indexCallback: IndexCallback;
    language: string;
    project: ProjectReport["project"];
    logo?: string;
    date: string;
}

interface TranslatedDefinition {
    name: string;
    description: string;
}

type TranslatedDictionary = Record<string, TranslatedDefinition>;

export const MethodExplanationPage = ({ indexCallback, language, project, logo, date }: MethodExplanationPageProps) => {
    const linkId = "methodExplanation";
    const { t } = useTranslation("report", { lng: language });
    const attackers = t("attackers", { returnObjects: true }) as TranslatedDictionary;
    const pointsOfAttacks = t("pointsOfAttacks", { returnObjects: true }) as TranslatedDictionary;

    return (
        <Page
            logo={logo}
            projectName={project.name}
            date={date}
            confidentialityLevel={t("confidentialityLevels." + project.confidentialityLevel)}
        >
            <View
                render={({ pageNumber }) => {
                    indexCallback(pageNumber, t("method"), linkId);
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
                {t("method")}
            </Text>
            <Text size="small">{t("explanationIdea")}</Text>
            <ThreatMatrix language={language}></ThreatMatrix>
            <Text
                style={{
                    marginTop: s2,
                    marginBottom: s1,
                }}
            >
                {t("attackersHeader")}:
            </Text>
            {Object.values(attackers).map((attacker) => (
                <View
                    key={JSON.stringify(attacker)}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "stretch",
                        marginLeft: s2,
                        marginBottom: s1,
                    }}
                >
                    <Text
                        size="small"
                        style={{
                            fontWeight: 600,
                        }}
                    >
                        {attacker.name}:
                    </Text>
                    <Text size="small" style={{}}>
                        {attacker.description}
                    </Text>
                </View>
            ))}
            <Text
                style={{
                    marginTop: s2,
                    marginBottom: s1,
                }}
            >
                {t("pointsOfAttackHeader")}:
            </Text>
            {Object.values(pointsOfAttacks).map((pointOfAttack) => (
                <View
                    key={JSON.stringify(pointOfAttack)}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "stretch",
                        marginLeft: s2,
                        marginBottom: s1,
                    }}
                >
                    <Text
                        size="small"
                        style={{
                            fontWeight: 600,
                        }}
                    >
                        {pointOfAttack.name}:
                    </Text>
                    <Text size="small" style={{}}>
                        {pointOfAttack.description}
                    </Text>
                </View>
            ))}
            <Text
                size="small"
                style={{
                    marginTop: s2,
                }}
            >
                {t("explanationApplication")}
            </Text>
        </Page>
    );
};
