import type { ReactNode } from "react";
import { View } from "@react-pdf/renderer";
import type { IndexCallback } from "#api/types/project.types.ts";
import { s1 } from "#view/report/report.style.ts";
import { Page } from "#view/report/components/page.report.component.tsx";
import { Text } from "#view/report/components/text.report.component.tsx";

interface ChapterPagesProps<T> {
    groups: T[][];
    logo?: string;
    projectName: string;
    date: string;
    confidentialityLevel: string;
    chapterId: string;
    chapterTitle: string;
    indexCallback: IndexCallback;
    renderCard: (item: T) => ReactNode;
}

export const ChapterPages = <T,>({
    groups,
    logo,
    projectName,
    date,
    confidentialityLevel,
    chapterId,
    chapterTitle,
    indexCallback,
    renderCard,
}: ChapterPagesProps<T>) => (
    <>
        {groups.map((group, groupIdx) => (
            <Page
                key={groupIdx}
                logo={logo}
                projectName={projectName}
                date={date}
                confidentialityLevel={confidentialityLevel}
            >
                {groupIdx === 0 && (
                    <>
                        <View
                            render={({ pageNumber }) => {
                                indexCallback(pageNumber, chapterTitle, chapterId);
                                return null;
                            }}
                        />
                        <Text id={`chapter-${chapterId}`} size="header" style={{ marginBottom: s1 }}>
                            {chapterTitle}
                        </Text>
                    </>
                )}
                {group.map(renderCard)}
            </Page>
        ))}
    </>
);
