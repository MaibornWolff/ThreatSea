import React, { useState } from "react";
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
import { MeasuresDetailsPage } from "./pages/measures.report.page";
import { Translations } from "../wrappers/translations.wrapper";

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

const Report = ({
    tillScheduledAt,
    showCoverPage = true,
    showTableOfContentsPage = true,
    showMethodExplanation = true,
    showScaleExplanation = true,
    showMatrixPage = true,
    showAssetsPage = true,
    showMeasuresPage = true,
    showThreatListPage = true,
    showThreatsPage = true,

    systemImageOnSeperatePage = false,
    bruttoMatrix,
    nettoMatrix,
    language = "en",
    logo,
    companyLogo,
    data,
}) => {
    const date = new Date().toISOString().split("T")[0];
    const [index, setIndex] = useState({});
    const newIndex = {};
    let chapterCount = 0; //wrapping phase
    let secondCount = 0; //render phase

    const addToIndex = (pageNumber, chapterName, chapterId) => {
        if (!newIndex[chapterId]) {
            newIndex[chapterId] = { chapterName, chapterId, pageNumber };
            chapterCount++;
        } else {
            secondCount++;
        }
        //only update the index on the last render of the last chapter
        if (secondCount === chapterCount && JSON.stringify(index) !== JSON.stringify(newIndex)) {
            // SET NEW INDEX
            setIndex(newIndex);
        }
    };

    return (
        <Translations>
            <Document>
                {showCoverPage && (
                    <CoverPage
                        indexCallback={addToIndex}
                        systemImageOnSeperatePage={systemImageOnSeperatePage}
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
                    <MethodExplanationPage
                        indexCallback={addToIndex}
                        language={language}
                        date={date}
                        index={index}
                        {...data}
                    />
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
                {systemImageOnSeperatePage && (
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
                    <ThreatsListPage language={language} indexCallback={addToIndex} date={date} {...data} />
                )}
                {showThreatsPage && (
                    <ThreatsDetailsPage language={language} indexCallback={addToIndex} date={date} {...data} />
                )}
            </Document>
        </Translations>
    );
};

export default Report;
