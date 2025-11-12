import { Link, View } from "@react-pdf/renderer";
import { useTranslation } from "react-i18next";
import { Page } from "../components/page.report.component";
import { Text } from "../components/text.report.component";
import { s1 } from "../report.style";
import type { Index, IndexCallback, IndexEntry, ProjectReport } from "#api/types/project.types.ts";

interface TableOfContentsPageProps {
    indexCallback: IndexCallback;
    project: ProjectReport["project"];
    logo?: string;
    index: Index;
    language: string;
    date: string;
}

interface TableOfContentsRowProps extends IndexEntry {
    number: number;
}

export const TableOfContentsPage = ({
    indexCallback,
    project,
    logo,
    index,
    language,
    date,
}: TableOfContentsPageProps) => {
    const chapters = Object.values(index).sort((a, b) => {
        return a.pageNumber - b.pageNumber;
    });
    const linkId = "tableOfContents";
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
                    indexCallback(pageNumber, t("tableOfContents"), linkId);
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
                {t("tableOfContents")}
            </Text>
            <View
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <Text size="small" style={{ flex: 2, padding: s1, fontWeight: 600 }}>
                    {t("chapter")}
                </Text>
                <Text
                    size="small"
                    style={{
                        flex: 1,
                        padding: s1,
                        paddingLeft: s1 + 2,
                        fontWeight: 600,
                    }}
                >
                    {t("pagenumber")}
                </Text>
            </View>
            {chapters.map((chapter, i) => (
                <TableOfContentsRow key={JSON.stringify(chapter)} number={i + 1} {...chapter} />
            ))}
        </Page>
    );
};

const TableOfContentsRow = ({ chapterId, number, chapterName, pageNumber }: TableOfContentsRowProps) => {
    return (
        <Link
            src={`#chapter-${chapterId}`}
            style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "stretch",
                justifyContent: "space-between",
                textDecoration: "none",
            }}
            wrap={false}
        >
            <View
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 2,
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
                    {number}.
                </Text>
                <Text size="small">{chapterName}</Text>
            </View>
            <View
                style={{
                    display: "flex",
                    flexDirection: "row",
                    flex: 1,
                    padding: s1,
                    borderLeft: "2px solid #fff",
                }}
            >
                <Text
                    size="small"
                    style={{
                        textAlign: "right",
                    }}
                >
                    {pageNumber}
                </Text>
            </View>
        </Link>
    );
};
