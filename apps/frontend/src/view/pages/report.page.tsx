import { Backdrop, CircularProgress, LinearProgress, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { memo, useCallback, useEffect, useLayoutEffect, type ChangeEvent, type SyntheticEvent } from "react";
import { useTranslation } from "react-i18next";

import type { ExtendedProject } from "#api/types/project.types.ts";
import type { SortDirection } from "#application/actions/list.actions.ts";
import { NavigationActions } from "#application/actions/navigation.actions.ts";
import { useReport } from "#application/hooks/use-report.hook.ts";
import { useReportExcelExport } from "#application/hooks/use-export.hook.ts";
import { useReportPdf } from "#application/hooks/use-report-pdf.hook.ts";
import { useAppDispatch } from "#application/hooks/use-app-redux.hook.ts";
// Inlined as data URLs: react-pdf fetches URL images with a bare fetch() during
// every render, and a stalled request wedges the render with no error (seen
// intermittently in Firefox). Data URLs need no network at all.
import logo from "#images/logo_large.png?inline";
import companyLogo from "#images/MaibornWolff_Logo.png?inline";
import { Button } from "#view/components/button.component.tsx";
import { Page } from "#view/components/page.component.tsx";
import { CreatePage } from "#view/components/create-page.component.tsx";
import { usePageTitle } from "#application/hooks/use-page-title.hook.ts";
import { HeaderUtilityControls } from "#view/components/header-utility-controls.component.tsx";
import { downloadMarkdownReport } from "#view/report/download-markdown-report.ts";
import { withProject } from "#view/components/with-project.hoc.tsx";
import {
    PageSettingsColumn,
    type PageToggle,
} from "#view/components/report-components/page-settings-column.component.tsx";
import { RiskMatrixSettingsColumn } from "#view/components/report-components/risk-matrix-settings-column.component.tsx";
import { OutputSettingsColumn } from "#view/components/report-components/output-settings-column.component.tsx";

interface ReportPageBodyProps {
    project: ExtendedProject;
}

type ReportHookReturn = ReturnType<typeof useReport>;
type ReportMilestone = NonNullable<ReportHookReturn["milestones"]>[number];

const ReportPageBody = ({ project }: ReportPageBodyProps) => {
    const {
        t,
        i18n: { language },
    } = useTranslation("reportPage");
    usePageTitle(t("report", { ns: "common" }));

    const projectId = project.id;

    const {
        riskMatrixMeasures,
        data,
        filename,
        bruttoMatrix,
        nettoMatrix,
        milestones,
        isChanged,
        fromScheduledAt,
        tillScheduledAt,
        sortDirection,
        sortBy,
        showCoverPage,
        showTableOfContentsPage,
        showMethodExplanation,
        showScaleExplanation,
        showMatrixPage,
        showComponentsPage,
        showAssetsPage,
        showMeasuresPage,
        showThreatListPage,
        showThreatsPage,
        systemImageOnSeparatePage,
        reportLanguage,
        measures,
        threats,
        setRiskMatrixMeasures,
        setIsChanged,
        setFromScheduledAt,
        setTillScheduledAt,
        setSortDirection,
        setSortBy,
        setShowCoverPage,
        setShowTableOfContentsPage,
        setShowMethodExplanation,
        setShowScaleExplanation,
        setShowMatrixPage,
        setShowComponentsPage,
        setShowAssetsPage,
        setShowMeasuresPage,
        setShowThreatListPage,
        setShowThreatsPage,
        setSystemImageOnSeparatePage,
        setReportLanguage,
    } = useReport({
        projectId,
    });

    const { exportReportAsExcel } = useReportExcelExport();

    const dispatch = useAppDispatch();

    // Generates the PDF in a web worker so the main thread stays responsive
    const { url, loading, error, generate } = useReportPdf();

    /**
     * Layout effect to change the header bar
     * to the current environment the user is at.
     */
    useLayoutEffect(() => {
        dispatch(
            NavigationActions.setPageHeader({
                showProjectCatalogueInnerNavigation: true,
                showUniversalHeaderNavigation: true,
                showProjectInfo: true,
            })
        );
    }, [dispatch]);

    const onChangeLanguage = (_event: SyntheticEvent, value: string | null) => {
        if (value) {
            setReportLanguage(value);
            setIsChanged(true);
        }
    };

    const handleTogglePage =
        (setPage: (value: boolean) => void) => (_event: ChangeEvent<HTMLInputElement>, value: boolean) => {
            setPage(value);
            setIsChanged(true);
        };

    // Each entry renders one switch in the page-settings column. The id doubles as the i18n label key.
    const pageToggles: PageToggle[] = [
        { id: "coverPage", checked: showCoverPage, onChange: handleTogglePage(setShowCoverPage) },
        {
            id: "tableOfContentsPage",
            checked: showTableOfContentsPage,
            onChange: handleTogglePage(setShowTableOfContentsPage),
        },
        {
            id: "methodExplanation",
            checked: showMethodExplanation,
            onChange: handleTogglePage(setShowMethodExplanation),
        },
        { id: "scaleExplanation", checked: showScaleExplanation, onChange: handleTogglePage(setShowScaleExplanation) },
        { id: "matrixPage", checked: showMatrixPage, onChange: handleTogglePage(setShowMatrixPage) },
        { id: "componentPage", checked: showComponentsPage, onChange: handleTogglePage(setShowComponentsPage) },
        { id: "assetPage", checked: showAssetsPage, onChange: handleTogglePage(setShowAssetsPage) },
        { id: "measuresPage", checked: showMeasuresPage, onChange: handleTogglePage(setShowMeasuresPage) },
        { id: "threatListPage", checked: showThreatListPage, onChange: handleTogglePage(setShowThreatListPage) },
        { id: "threatsPage", checked: showThreatsPage, onChange: handleTogglePage(setShowThreatsPage) },
        {
            id: "systemImageOnSeparatePage",
            checked: systemImageOnSeparatePage,
            onChange: handleTogglePage(setSystemImageOnSeparatePage),
        },
    ];

    const onChangeFromScheduledAt = (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.currentTarget.value;
        setFromScheduledAt(value);
        setIsChanged(true);
    };

    const onChangeTillScheduledAt = (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.currentTarget.value;
        setTillScheduledAt(value);
        setIsChanged(true);
    };

    const onClickRefresh = () => {
        if (!data) {
            return;
        }
        setIsChanged(false);
        generate({
            tillScheduledAt,
            showCoverPage,
            showTableOfContentsPage,
            showMethodExplanation,
            showScaleExplanation,
            showMatrixPage,
            showComponentsPage,
            showAssetsPage,
            showMeasuresPage,
            showThreatListPage,
            showThreatsPage,
            systemImageOnSeparatePage,
            language: reportLanguage,
            logo,
            companyLogo,
            bruttoMatrix,
            nettoMatrix,
            data: { ...data, milestones, threats: threats ?? [], measures: measures ?? [] },
        });
    };

    const onChangeSortDirection = (_event: SyntheticEvent, value: SortDirection | null) => {
        if (value) {
            setSortDirection(value);
            setIsChanged(true);
        }
    };

    const onChangeSortBy = (_event: SyntheticEvent, value: string | null) => {
        if (value) {
            setSortBy(value);
            setIsChanged(true);
        }
    };

    const onChangeActiveMilestone = (milestone: ReportMilestone, value: boolean) => {
        const id = milestone.scheduledAt.toISOString().substring(0, 10);
        if (value && !riskMatrixMeasures.includes(id)) {
            setRiskMatrixMeasures([...riskMatrixMeasures, id]);
            setIsChanged(true);
        } else if (!value && riskMatrixMeasures.includes(id)) {
            setRiskMatrixMeasures([...riskMatrixMeasures.filter((currId) => currId !== id)]);
            setIsChanged(true);
        }
    };

    const handleExport = () => {
        exportReportAsExcel(project, data);
    };

    const handleDownloadMarkdown = useCallback(() => {
        downloadMarkdownReport({
            data,
            filename,
            milestones,
            threats,
            measures,
            bruttoMatrix,
            nettoMatrix,
            tillScheduledAt,
            showCoverPage,
            showTableOfContentsPage,
            showMethodExplanation,
            showScaleExplanation,
            showMatrixPage,
            showComponentsPage,
            showAssetsPage,
            showMeasuresPage,
            showThreatListPage,
            showThreatsPage,
            systemImageOnSeparatePage,
            language: reportLanguage,
        });
    }, [
        data,
        filename,
        milestones,
        threats,
        measures,
        bruttoMatrix,
        nettoMatrix,
        tillScheduledAt,
        showCoverPage,
        showTableOfContentsPage,
        showMethodExplanation,
        showScaleExplanation,
        showMatrixPage,
        showComponentsPage,
        showAssetsPage,
        showMeasuresPage,
        showThreatListPage,
        showThreatsPage,
        systemImageOnSeparatePage,
        reportLanguage,
    ]);

    useEffect(() => {
        setIsChanged(true);
    }, [setIsChanged, language]);

    return (
        <Box>
            <Backdrop open={loading} sx={{ zIndex: 999 }}>
                <Box
                    sx={{
                        p: 2,
                        borderRadius: 5,
                        bgcolor: "background.paperIntransparent",
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                    }}
                >
                    <CircularProgress size={24} />
                    <Typography>{t("reportLoads")}</Typography>
                </Box>
            </Backdrop>
            {<LinearProgress sx={{ visibility: data ? "hidden" : "visible" }} />}
            <Page
                sx={{
                    padding: 0,
                    paddingLeft: 6,
                    paddingRight: 6,
                }}
            >
                {data && (
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "row",
                                width: "100%",
                                marginTop: 5,
                            }}
                        >
                            <PageSettingsColumn toggles={pageToggles} />

                            <RiskMatrixSettingsColumn
                                milestones={milestones}
                                onChangeMilestone={onChangeActiveMilestone}
                                fromScheduledAt={fromScheduledAt}
                                tillScheduledAt={tillScheduledAt}
                                onChangeFromScheduledAt={onChangeFromScheduledAt}
                                onChangeTillScheduledAt={onChangeTillScheduledAt}
                            />

                            <OutputSettingsColumn
                                reportLanguage={reportLanguage}
                                onChangeLanguage={onChangeLanguage}
                                sortBy={sortBy}
                                onChangeSortBy={onChangeSortBy}
                                sortDirection={sortDirection}
                                onChangeSortDirection={onChangeSortDirection}
                                onExport={handleExport}
                            />
                        </Box>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-end",
                            }}
                        >
                            {isChanged || error ? (
                                <Box sx={{ marginTop: 2, display: "flex", alignItems: "center" }}>
                                    {error && (
                                        <Typography sx={{ marginRight: 1, color: "error.main" }}>{error}</Typography>
                                    )}
                                    <Button sx={{ marginRight: 1 }} onClick={onClickRefresh}>
                                        {t("createBtn")}
                                    </Button>
                                    <Button sx={{ marginRight: 0 }} onClick={handleDownloadMarkdown}>
                                        {t("downloadMarkdownBtn")}
                                    </Button>
                                </Box>
                            ) : (
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "flex-end",
                                        width: "100%",
                                        marginTop: 2,
                                    }}
                                >
                                    {url ? (
                                        <>
                                            <Button
                                                component="a"
                                                href={url}
                                                {...{ target: "_blank" }}
                                                rel="noreferrer"
                                                sx={{ marginRight: 1 }}
                                            >
                                                {t("openInBrowserBtn")}
                                            </Button>
                                            <Button
                                                component="a"
                                                href={url}
                                                {...{ download: `${filename}.pdf` }}
                                                sx={{ marginRight: 1 }}
                                            >
                                                {t("downloadPdfBtn")}
                                            </Button>
                                        </>
                                    ) : null}
                                    <Button onClick={handleDownloadMarkdown}>{t("downloadMarkdownBtn")}</Button>
                                </Box>
                            )}
                        </Box>
                    </Box>
                )}
            </Page>
        </Box>
    );
};

export const ReportPage = memo(CreatePage(HeaderUtilityControls, withProject(ReportPageBody)));
ReportPage.displayName = "ReportPage";
