import { useState, useRef, useCallback, type FC } from "react";
import { Document, Font } from "@react-pdf/renderer";
import { CoverPage } from "./pages/cover.report.page";
import { SystemImagePage } from "./pages/system-image.report.page";
import { ThreatsListPage } from "./pages/threatsList.report.page";
import { MatrixPage } from "./pages/matrix.report.page";
import { ThreatsDetailsPage } from "./pages/threatsDetails.report.page";
import { TableOfContentsPage } from "./pages/table-of-contents.page";
import { MethodExplanationPage } from "./pages/methodExplanation.report.page";
import { ScaleExplanationPage } from "./pages/scaleExplanation.report.page";
import poppinsThin from "./font/Poppins_Thin_250.ttf";
import poppinsRegular from "./font/Poppins_Regular_400.ttf";
import poppinsLightItalic from "./font/Poppins-LightItalic.ttf";
import poppinsMedium from "./font/Poppins_Medium_500.ttf";
import poppinsSemiBold from "./font/Poppins_SemiBold_600.ttf";
import poppinsBold from "./font/Poppins_Bold_700.ttf";
import poppinsExtraBold from "./font/Poppins_ExtraBold_800.ttf";
import { AssetsDetailsPage } from "./pages/assetsDetails.report.page";
import { ComponentsDetailsPage } from "./pages/componentsDetails.report.page";
import { MeasuresDetailsPage } from "./pages/measures.report.page";
import { Translations } from "#view/wrappers/translations.wrapper.tsx";
import type { Index, ProjectReport } from "#api/types/project.types.ts";
import type { Milestone, RiskMatrix } from "#application/hooks/use-report.hook.ts";

Font.register({
    family: "Poppins",
    fonts: [
        {
            src: poppinsThin,
            fontWeight: 250,
        },
        {
            src: poppinsRegular,
        },
        {
            src: poppinsLightItalic,
            fontStyle: "italic",
        },
        {
            src: poppinsMedium,
            fontWeight: 500,
        },
        {
            src: poppinsSemiBold,
            fontWeight: 600,
        },
        {
            src: poppinsBold,
            fontWeight: 700,
        },
        {
            src: poppinsExtraBold,
            fontWeight: 800,
        },
    ],
});

interface ReportProps {
    tillScheduledAt?: string | null;
    showCoverPage?: boolean;
    showTableOfContentsPage?: boolean;
    showMethodExplanation?: boolean;
    showScaleExplanation?: boolean;
    showMatrixPage?: boolean;
    showComponentsPage?: boolean;
    showAssetsPage?: boolean;
    showMeasuresPage?: boolean;
    showThreatListPage?: boolean;
    showThreatsPage?: boolean;
    systemImageOnSeparatePage?: boolean;
    bruttoMatrix: RiskMatrix | null;
    nettoMatrix: RiskMatrix | null;
    language?: string;
    logo?: string;
    companyLogo?: string;
    data: ProjectReport & { milestones?: Milestone[] | null };
}

export const Report: FC<ReportProps> = ({
    tillScheduledAt,
    showCoverPage = true,
    showTableOfContentsPage = true,
    showMethodExplanation = true,
    showScaleExplanation = true,
    showMatrixPage = true,
    showComponentsPage = true,
    showAssetsPage = true,
    showMeasuresPage = true,
    showThreatListPage = true,
    showThreatsPage = true,

    systemImageOnSeparatePage = false,
    bruttoMatrix,
    nettoMatrix,
    language = "en",
    logo,
    companyLogo,
    data,
}) => {
    const date = new Date().toISOString().split("T")[0]!;
    const [index, setIndex] = useState<Index>({});
    // Accumulates page numbers across all react-pdf layout passes. Using a ref keeps the
    // reference stable across React renders so that stale closures are never an issue.
    const pendingIndexRef = useRef<Index>({});
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // react-pdf calls render-prop callbacks on every internal layout pass (wrapping pass,
    // render pass, and any extra passes for complex documents). We always store the *latest*
    // page number for each chapter (last write wins) and debounce the React state update so
    // it fires exactly once after the final pass — no matter how many passes react-pdf needs.
    // This guarantees exactly two React renders per PDF generation (capture + verify) instead
    // of the 2-∞ that the old pass-counting heuristic could produce for large documents.
    const addToIndex = useCallback((pageNumber: number, chapterName: string, chapterId: string): void => {
        pendingIndexRef.current = {
            ...pendingIndexRef.current,
            [chapterId]: { chapterName, chapterId, pageNumber },
        };
        if (timerRef.current !== null) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
            timerRef.current = null;
            setIndex((prev) => {
                const next = pendingIndexRef.current;
                return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
            });
        }, 0);
    }, []);

    return (
        <Translations>
            <Document>
                {showCoverPage && (
                    <CoverPage
                        indexCallback={addToIndex}
                        systemImageOnSeparatePage={systemImageOnSeparatePage}
                        language={language}
                        logo={logo}
                        companyLogo={companyLogo}
                        date={date}
                        {...data}
                    />
                )}
                {showTableOfContentsPage && index && (
                    <TableOfContentsPage
                        indexCallback={addToIndex}
                        language={language}
                        date={date}
                        index={index}
                        {...data}
                    />
                )}
                {showMethodExplanation && (
                    <MethodExplanationPage indexCallback={addToIndex} language={language} date={date} {...data} />
                )}
                {showScaleExplanation && (
                    <ScaleExplanationPage
                        indexCallback={addToIndex}
                        language={language}
                        date={date}
                        index={index}
                        {...data}
                    />
                )}
                {systemImageOnSeparatePage && (
                    <SystemImagePage indexCallback={addToIndex} language={language} date={date} {...data} />
                )}
                {showMatrixPage && (
                    <MatrixPage
                        indexCallback={addToIndex}
                        language={language}
                        tillScheduledAt={tillScheduledAt}
                        date={date}
                        bruttoMatrix={bruttoMatrix}
                        nettoMatrix={nettoMatrix}
                        {...data}
                    />
                )}
                {showComponentsPage && (
                    <ComponentsDetailsPage indexCallback={addToIndex} language={language} date={date} {...data} />
                )}
                {showAssetsPage && (
                    <AssetsDetailsPage indexCallback={addToIndex} language={language} date={date} {...data} />
                )}
                {showMeasuresPage && (
                    <MeasuresDetailsPage
                        language={language}
                        indexCallback={addToIndex}
                        date={date}
                        {...data}
                    ></MeasuresDetailsPage>
                )}
                {showThreatListPage && (
                    <ThreatsListPage language={language} logo={logo} indexCallback={addToIndex} date={date} {...data} />
                )}
                {showThreatsPage && (
                    <ThreatsDetailsPage
                        language={language}
                        logo={logo}
                        indexCallback={addToIndex}
                        date={date}
                        showComponentsPage={showComponentsPage}
                        showAssetsPage={showAssetsPage}
                        showMeasuresPage={showMeasuresPage}
                        {...data}
                    />
                )}
            </Document>
        </Translations>
    );
};
