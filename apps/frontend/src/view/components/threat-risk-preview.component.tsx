import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { MATRIX_COLOR, type MatrixColorKey } from "#view/colors/matrix.ts";

interface ThreatRiskPreviewProps {
    grossRisk: number;
    grossColor: MatrixColorKey;
    netRisk: number;
    netColor: MatrixColorKey;
}

const pillSx = {
    minWidth: 80,
    paddingX: 1.5,
    paddingY: 0.5,
    borderRadius: 5,
    textAlign: "center",
    fontSize: "0.875rem",
} as const;

export const ThreatRiskPreview = ({ grossRisk, grossColor, netRisk, netColor }: ThreatRiskPreviewProps) => {
    const { t } = useTranslation("threatDialogPage");

    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontSize: "0.875rem", fontWeight: "bold" }}>{t("risk")}</Typography>
            <Box sx={{ ...pillSx, backgroundColor: MATRIX_COLOR[grossColor].light }} data-testid="GrossRisk">
                {grossRisk} ({t("gross")})
            </Box>
            <Box sx={{ ...pillSx, backgroundColor: MATRIX_COLOR[netColor].light }} data-testid="NetRisk">
                {netRisk} ({t("net")})
            </Box>
        </Box>
    );
};
