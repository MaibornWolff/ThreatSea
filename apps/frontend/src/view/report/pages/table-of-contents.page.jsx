import { Page } from "../components/page.report.component";
import { Link, View } from "@react-pdf/renderer";
import { s1 } from "../report.style";
import { Text } from "../components/text.report.component";
import { useTranslation } from "react-i18next";

export const TableOfContentsPage = ({ indexCallback, project, logo, index, language, date }) => {
    index = Object.values(index);
    index.sort((a, b) => {
        return a - b;
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
            {index.map((chapter, i) => (
                <TableOfContentsRow key={JSON.stringify(chapter)} number={i + 1} {...chapter} />
            ))}
        </Page>
    );
};

const TableOfContentsRow = ({ chapterId, number, chapterName, pageNumber }) => {
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
                    alignItems: "right",
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
