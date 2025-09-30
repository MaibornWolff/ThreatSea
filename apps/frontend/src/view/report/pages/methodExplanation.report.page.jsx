import React from "react";
import { View } from "@react-pdf/renderer";
import { s1, s2 } from "../report.style";
import { Page } from "../components/page.report.component";
import { useTranslation } from "react-i18next";
import { Text } from "../components/text.report.component";
import { ThreatMatrix } from "../components/threatMatrix.report.component";

export const MethodExplanationPage = ({ indexCallback, language, project, logo, date }) => {
    const linkId = "methodExplanation";
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
                    indexCallback(pageNumber, t("method"), linkId);
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
            {Object.values(t("attackers", { returnObjects: true })).map((attacker) => (
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
            {Object.values(t("pointsOfAttacks", { returnObjects: true })).map((pointOfAttack) => (
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
