import { ArrowDownward, ArrowUpward } from "@mui/icons-material";
import { Backdrop, FormControl, FormControlLabel, LinearProgress, Switch, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { BlobProvider } from "@react-pdf/renderer";
import React, { useEffect, useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { NavigationActions } from "../../application/actions/navigation.actions";
import { useReport } from "../../application/hooks/use-report.hook";
import logo from "../../images/logo_large.png";
import companyLogo from "../../images/MaibornWolff_Logo.png";
import { Button } from "../components/button.component";
import { DialogTextField } from "../components/dialog.textfield.component";
import { Page } from "../components/page.component";
import { ToggleButtons } from "../components/toggle-buttons.component";
import { CreatePage, HeaderNavigation } from "../components/with-menu.component";
import Report from "../report/report";
import { ExportIconButton } from "../components/export-icon-button.component";
import { withProject } from "../components/with-project.hoc";

const ReportPageBody = ({ project }) => {
    const {
        t,
        i18n: { language },
    } = useTranslation("reportPage");

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
        showAssetsPage,
        showMeasuresPage,
        showThreatListPage,
        showThreatsPage,
        systemImageOnSeperatePage,
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
        setShowAssetsPage,
        setShowMeasuresPage,
        setShowThreatListPage,
        setShowThreatsPage,
        setSystemImageOnSeperatePage,
        setReportLanguage,
        fullExportAsExcel,
    } = useReport({
        projectId: parseInt(projectId),
    });

    const dispatch = useDispatch();

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
    });

    const onChangeLanguage = (_, value) => {
        if (value) {
            setReportLanguage(value);
            setIsChanged(true);
        }
    };

    const onChangeShowCoverPage = (_, value) => {
        setShowCoverPage(value);
        setIsChanged(true);
    };

    const onChangeShowTableOfContents = (_, value) => {
        setShowTableOfContentsPage(value);
        setIsChanged(true);
    };

    const onChangeShowMethodExplanation = (_, value) => {
        setShowMethodExplanation(value);
        setIsChanged(true);
    };

    const onChangeShowScaleExplanation = (_, value) => {
        setShowScaleExplanation(value);
        setIsChanged(true);
    };

    const onChangeShowMatrixPage = (_, value) => {
        setShowMatrixPage(value);
        setIsChanged(true);
    };

    const onChangeShowAssetsPage = (_, value) => {
        setShowAssetsPage(value);
        setIsChanged(true);
    };

    const onChangeShowMeasuresPage = (_, value) => {
        setShowMeasuresPage(value);
        setIsChanged(true);
    };

    const onChangeShowThreatListPage = (_, value) => {
        setShowThreatListPage(value);
        setIsChanged(true);
    };

    const onChangeShowThreatsPage = (_, value) => {
        setShowThreatsPage(value);
        setIsChanged(true);
    };

    const onChangeSystemImageOnSeperatePage = (_, value) => {
        setSystemImageOnSeperatePage(value);
        setIsChanged(true);
    };

    const onChangeFromScheduledAt = (e) => {
        const value = e.currentTarget.value;
        setFromScheduledAt(value);
        setIsChanged(true);
    };

    const onChangeTillScheduledAt = (e) => {
        const value = e.currentTarget.value;
        setTillScheduledAt(value);
        setIsChanged(true);
    };

    const onClickRefresh = () => {
        setIsChanged(false);
    };

    const onChangeSortDirection = (_, value) => {
        if (value) {
            setSortDirection(value);
            setIsChanged(true);
        }
    };

    const onChangeSortBy = (_, value) => {
        if (value) {
            setSortBy(value);
            setIsChanged(true);
        }
    };

    const onChangeActiveMilestone = (milestone, value) => {
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
        fullExportAsExcel(project, data);
    };

    useEffect(() => {
        setIsChanged(true);
    }, [setIsChanged, language]);

    return (
        <Box>
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
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "stretch",
                                    borderRadius: 5,
                                    boxShadow: 1,
                                    padding: 4,
                                    marginRight: 2,
                                    width: "35%",
                                    backgroundColor: "background.paperIntransparent",
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: "0.875rem",
                                        fontWeight: "bold",
                                        marginBottom: 1,
                                    }}
                                >
                                    {t("pageSettings")}
                                </Typography>
                                <FormControl sx={{ margin: 0, marginBottom: 1 }}>
                                    <FormControlLabel
                                        control={<Switch checked={showCoverPage} onChange={onChangeShowCoverPage} />}
                                        label={<Typography sx={{ fontSize: "0.875rem" }}>{t("coverPage")}</Typography>}
                                        labelPlacement="end"
                                    />
                                </FormControl>
                                <FormControl sx={{ margin: 0, marginBottom: 1 }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={showTableOfContentsPage}
                                                onChange={onChangeShowTableOfContents}
                                            />
                                        }
                                        label={
                                            <Typography sx={{ fontSize: "0.875rem" }}>
                                                {t("tableOfContentsPage")}
                                            </Typography>
                                        }
                                        labelPlacement="end"
                                    />
                                </FormControl>
                                <FormControl sx={{ margin: 0, marginBottom: 1 }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={showMethodExplanation}
                                                onChange={onChangeShowMethodExplanation}
                                            />
                                        }
                                        label={
                                            <Typography sx={{ fontSize: "0.875rem" }}>
                                                {t("methodExplanation")}
                                            </Typography>
                                        }
                                        labelPlacement="end"
                                    />
                                </FormControl>
                                <FormControl sx={{ margin: 0, marginBottom: 1 }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={showScaleExplanation}
                                                onChange={onChangeShowScaleExplanation}
                                            />
                                        }
                                        label={
                                            <Typography sx={{ fontSize: "0.875rem" }}>
                                                {t("scaleExplanation")}
                                            </Typography>
                                        }
                                        labelPlacement="end"
                                    />
                                </FormControl>

                                <FormControl sx={{ margin: 0, marginBottom: 1 }}>
                                    <FormControlLabel
                                        control={<Switch checked={showMatrixPage} onChange={onChangeShowMatrixPage} />}
                                        label={<Typography sx={{ fontSize: "0.875rem" }}>{t("matrixPage")}</Typography>}
                                        labelPlacement="end"
                                    />
                                </FormControl>
                                <FormControl sx={{ margin: 0, marginBottom: 1 }}>
                                    <FormControlLabel
                                        control={<Switch checked={showAssetsPage} onChange={onChangeShowAssetsPage} />}
                                        label={<Typography sx={{ fontSize: "0.875rem" }}>{t("assetPage")}</Typography>}
                                        labelPlacement="end"
                                    />
                                </FormControl>
                                <FormControl sx={{ margin: 0, marginBottom: 1 }}>
                                    <FormControlLabel
                                        control={
                                            <Switch checked={showMeasuresPage} onChange={onChangeShowMeasuresPage} />
                                        }
                                        label={
                                            <Typography sx={{ fontSize: "0.875rem" }}>{t("measuresPage")}</Typography>
                                        }
                                        labelPlacement="end"
                                    />
                                </FormControl>
                                <FormControl sx={{ margin: 0, marginBottom: 1 }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={showThreatListPage}
                                                onChange={onChangeShowThreatListPage}
                                            />
                                        }
                                        label={
                                            <Typography sx={{ fontSize: "0.875rem" }}>{t("threatListPage")}</Typography>
                                        }
                                        labelPlacement="end"
                                    />
                                </FormControl>
                                <FormControl sx={{ margin: 0, marginBottom: 1 }}>
                                    <FormControlLabel
                                        control={
                                            <Switch checked={showThreatsPage} onChange={onChangeShowThreatsPage} />
                                        }
                                        label={
                                            <Typography sx={{ fontSize: "0.875rem" }}>{t("threatsPage")}</Typography>
                                        }
                                        labelPlacement="end"
                                    />
                                </FormControl>
                                <FormControl sx={{ margin: 0, marginBottom: 1 }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={systemImageOnSeperatePage}
                                                onChange={onChangeSystemImageOnSeperatePage}
                                            />
                                        }
                                        label={
                                            <Typography sx={{ fontSize: "0.875rem" }}>
                                                {t("systemImageOnSeperatePage")}
                                            </Typography>
                                        }
                                        labelPlacement="end"
                                    />
                                </FormControl>
                            </Box>

                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    marginRight: 2,
                                    width: "35%",
                                }}
                            >
                                <Box
                                    sx={{
                                        flex: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "stretch",
                                        borderRadius: 5,
                                        boxShadow: 1,
                                        padding: 4,
                                        paddingLeft: 2.5,
                                        overflow: "visible",
                                        maxHeight: "206px",
                                        backgroundColor: "background.paperIntransparent",
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontSize: "0.875rem",
                                            fontWeight: "bold",
                                            marginBottom: 1,
                                            paddingLeft: 1.5,
                                        }}
                                    >
                                        {t("riskMatrixSettings")}
                                    </Typography>
                                    <Box
                                        sx={{
                                            flex: 1,
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "stretch",
                                            overflowY: "auto",
                                            paddingLeft: 1.5,
                                        }}
                                    >
                                        {milestones.map((milestone, i) => {
                                            const { scheduledAt, active } = milestone;
                                            return (
                                                <FormControl
                                                    key={i}
                                                    fullWidth
                                                    sx={{
                                                        margin: 0,
                                                        marginBottom: 1,
                                                    }}
                                                >
                                                    <FormControlLabel
                                                        control={
                                                            <Switch
                                                                checked={active}
                                                                onChange={(_, value) =>
                                                                    onChangeActiveMilestone(milestone, value)
                                                                }
                                                            />
                                                        }
                                                        label={scheduledAt?.toISOString().split("T")[0]}
                                                        labelPlacement="end"
                                                        sx={{
                                                            marginRight: 0,
                                                        }}
                                                    />
                                                </FormControl>
                                            );
                                        })}
                                    </Box>
                                </Box>

                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        backgroundColor: "background.paperIntransparent",
                                        borderRadius: 5,
                                        boxShadow: 1,
                                        padding: 4,
                                        marginTop: 2,
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontSize: "0.875rem",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        {t("scheduledAt")}
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexDirection: "row",
                                        }}
                                    >
                                        <DialogTextField
                                            label={t("fromScheduledAt")}
                                            type="date"
                                            onChange={onChangeFromScheduledAt}
                                            value={fromScheduledAt}
                                            margin="normal"
                                            fullWidth
                                        />
                                        <DialogTextField
                                            sx={{ ml: 1 }}
                                            label={t("tillScheduledAt")}
                                            type="date"
                                            onChange={onChangeTillScheduledAt}
                                            value={tillScheduledAt}
                                            margin="normal"
                                            fullWidth
                                        />
                                    </Box>
                                </Box>
                            </Box>

                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    width: "30%",
                                }}
                            >
                                <Box
                                    sx={{
                                        backgroundColor: "background.paperIntransparent",
                                        padding: 4,
                                        borderRadius: 5,
                                        boxShadow: 1,
                                        marginBottom: 2,
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontSize: "0.875rem",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        {t("language")}
                                    </Typography>
                                    <FormControl sx={{ margin: 0, marginTop: 1 }}>
                                        <Box>
                                            <ToggleButtons
                                                onChange={onChangeLanguage}
                                                value={reportLanguage}
                                                buttons={[
                                                    {
                                                        text: "EN",
                                                        value: "en",
                                                    },
                                                    {
                                                        text: "DE",
                                                        value: "de",
                                                    },
                                                ]}
                                            />
                                        </Box>
                                    </FormControl>
                                </Box>

                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        backgroundColor: "background.paperIntransparent",
                                        borderRadius: 5,
                                        boxShadow: 1,
                                        padding: 4,
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontSize: "0.875rem",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        {t("sortThreats")}
                                    </Typography>
                                    <FormControl sx={{ margin: 0, marginTop: 1 }}>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <ToggleButtons
                                                sx={{ mr: 1 }}
                                                onChange={onChangeSortBy}
                                                value={sortBy}
                                                buttons={[
                                                    {
                                                        text: t("risk_net"),
                                                        value: "netRisk",
                                                    },
                                                    {
                                                        text: t("risk_gross"),
                                                        value: "risk",
                                                    },
                                                ]}
                                            />
                                            <ToggleButtons
                                                onChange={onChangeSortDirection}
                                                value={sortDirection}
                                                buttons={[
                                                    {
                                                        icon: ArrowUpward,
                                                        value: "asc",
                                                    },
                                                    {
                                                        icon: ArrowDownward,
                                                        value: "desc",
                                                    },
                                                ]}
                                            />
                                        </Box>
                                    </FormControl>
                                </Box>
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        backgroundColor: "background.paperIntransparent",
                                        borderRadius: 5,
                                        boxShadow: 1,
                                        padding: 4,
                                        marginTop: 2,
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontSize: "0.875rem",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        {t("export")}
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Typography sx={{ fontSize: "0.875rem" }}>{t("fullExport")}</Typography>
                                        <ExportIconButton
                                            title={t("fullExportBtn")}
                                            onClick={handleExport}
                                            sx={{ color: "text.primary" }}
                                        />
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-end",
                            }}
                        >
                            {isChanged ? (
                                <Box sx={{ marginTop: 2 }}>
                                    <Button sx={{ marginRight: 0 }} onClick={onClickRefresh}>
                                        {t("createBtn")}
                                    </Button>
                                </Box>
                            ) : (
                                <PdfDocumentToolbar
                                    filename={filename}
                                    logo={logo}
                                    companyLogo={companyLogo}
                                    tillScheduledAt={tillScheduledAt}
                                    showCoverPage={showCoverPage}
                                    showTableOfContentsPage={showTableOfContentsPage}
                                    showMethodExplanation={showMethodExplanation}
                                    showScaleExplanation={showScaleExplanation}
                                    showMatrixPage={showMatrixPage}
                                    showAssetsPage={showAssetsPage}
                                    showMeasuresPage={showMeasuresPage}
                                    showThreatListPage={showThreatListPage}
                                    showThreatsPage={showThreatsPage}
                                    systemImageOnSeperatePage={systemImageOnSeperatePage}
                                    language={reportLanguage}
                                    data={{
                                        ...data,
                                        milestones,
                                        threats,
                                        measures,
                                    }}
                                    bruttoMatrix={bruttoMatrix}
                                    nettoMatrix={nettoMatrix}
                                />
                            )}
                        </Box>
                    </Box>
                )}
            </Page>
        </Box>
    );
};

const PdfDocumentToolbar = ({ filename, ...props }) => {
    const { t } = useTranslation("reportPage");
    return (
        <BlobProvider document={<Report {...props} />}>
            {({ url, loading, error }) => {
                const disabled = url === null || loading;
                return (
                    <Box
                        id="box"
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            width: "100%",
                            marginTop: 2,
                        }}
                    >
                        {error ? (
                            <Typography>{error?.message || "Ein Fehler ist augetreten"}</Typography>
                        ) : loading ? (
                            <Backdrop open={true} sx={{ zIndex: 999 }}>
                                <Box
                                    sx={{
                                        p: 2,
                                        borderRadius: 5,
                                        bgcolor: "background.paperIntransparent",
                                    }}
                                >
                                    <Typography>{t("reportLoads")}</Typography>
                                </Box>
                            </Backdrop>
                        ) : (
                            <>
                                <Button
                                    component="a"
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    disabled={disabled}
                                    sx={{
                                        marginRight: 1,
                                    }}
                                >
                                    {t("openInBrowserBtn")}
                                </Button>
                                <Button
                                    component="a"
                                    href={url}
                                    download={`${filename}.pdf`}
                                    disabled={disabled}
                                    sx={{
                                        marginRight: 0,
                                    }}
                                >
                                    {t("downloadBtn")}
                                </Button>
                            </>
                        )}
                    </Box>
                );
            }}
        </BlobProvider>
    );
};

export const ReportPage = CreatePage(HeaderNavigation, withProject(ReportPageBody));
