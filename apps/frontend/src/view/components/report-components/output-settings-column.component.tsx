import { ArrowDownward, ArrowUpward } from "@mui/icons-material";
import { FormControl, Typography, Box } from "@mui/material";
import type { SyntheticEvent } from "react";
import { useTranslation } from "react-i18next";

import type { SortDirection } from "#application/actions/list.actions.ts";
import { ExportIconButton } from "#view/components/export-icon-button.component.tsx";
import { ToggleButtons } from "#view/components/toggle-buttons.component.tsx";

interface OutputSettingsColumnProps {
    reportLanguage: string;
    onChangeLanguage: (event: SyntheticEvent, value: string | null) => void;
    sortBy: string;
    onChangeSortBy: (event: SyntheticEvent, value: string | null) => void;
    sortDirection: SortDirection;
    onChangeSortDirection: (event: SyntheticEvent, value: SortDirection | null) => void;
    onExport: () => void;
}

export const OutputSettingsColumn = ({
    reportLanguage,
    onChangeLanguage,
    sortBy,
    onChangeSortBy,
    sortDirection,
    onChangeSortDirection,
    onExport,
}: OutputSettingsColumnProps) => {
    const { t } = useTranslation("reportPage");

    return (
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
                    <ExportIconButton title={t("fullExportBtn")} onClick={onExport} sx={{ color: "text.primary" }} />
                </Box>
            </Box>
        </Box>
    );
};
