import { View } from "@react-pdf/renderer";
import { s1, s2 } from "../report.style";
import { Page } from "../components/page.report.component";
import { useTranslation } from "react-i18next";
import { Text } from "../components/text.report.component";
import type { Index, ProjectReport } from "#api/types/project.types.ts";

type IndexCallback = (pageNumber: number, chapterName: string, chapterId: string) => void;

interface ScaleDefinition {
    name: string;
    description: string;
}

type ScaleDictionary = Record<string, ScaleDefinition>;

interface ScaleExplanationPageProps extends ProjectReport {
    indexCallback: IndexCallback;
    language: string;
    logo?: string;
    date: string;
    index: Index;
}

interface ScaleNameAndDescriptionProps {
    scale: ScaleDefinition;
    index: number;
}

export const ScaleExplanationPage = ({ indexCallback, language, project, logo, date }: ScaleExplanationPageProps) => {
    const linkId = "explanationScale";
    const { t } = useTranslation("report", { lng: language });
    const probabilities = t("probabilities", { returnObjects: true }) as ScaleDictionary;
    const damage = t("damages", { returnObjects: true }) as ScaleDictionary;

    return (
        <Page
            logo={logo}
            projectName={project.name}
            date={date}
            confidentialityLevel={t("confidentialityLevels." + project.confidentialityLevel)}
        >
            <View
                render={({ pageNumber }) => {
                    indexCallback(pageNumber, t("explanationScale"), linkId);
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
                {t("explanationScale")}
            </Text>
            <Text
                style={{
                    marginTop: s2,
                    marginBottom: s1,
                }}
            >
                {t("probability")}
            </Text>

            {Object.values(probabilities).map((probabilityScale, i) => (
                <ScaleNameAndDescription key={i} scale={probabilityScale} index={i + 1} />
            ))}

            <Text
                style={{
                    marginTop: s2,
                    marginBottom: s1,
                }}
            >
                {t("damage")}
            </Text>
            {Object.values(damage).map((damageScale, i) => (
                <ScaleNameAndDescription key={i} scale={damageScale} index={i + 1} />
            ))}
        </Page>
    );
};

const ScaleNameAndDescription = ({ scale, index }: ScaleNameAndDescriptionProps) => {
    return (
        <>
            <Text size="small" style={{ fontWeight: 600, marginBottom: s1 }}>
                {index} - {scale.name}
                {"\n"}
            </Text>
            <Text size="small" style={{ marginBottom: s1 }}>
                {scale.description}
                {"\n"}
            </Text>
        </>
    );
};
