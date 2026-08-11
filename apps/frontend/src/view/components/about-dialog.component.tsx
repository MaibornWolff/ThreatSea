import GitHub from "@mui/icons-material/GitHub";
import { Box, DialogActions, Link, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import logo from "#images/threatsealogo-dez.png";
import { APP_VERSION } from "#utils/version.ts";
import { Button } from "#view/components/button.component.tsx";
import { Dialog } from "./dialog.component";

interface AboutDialogProps {
    open: boolean;
    onClose: () => void;
}

export const AboutDialog = ({ open, onClose }: AboutDialogProps) => {
    const { t } = useTranslation("mainMenu");

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs">
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                }}
            >
                <img src={logo} height={64} alt="ThreatSea" />
                <Typography data-testid="about-dialog_version">{`${t("aboutDialog.version")}: ${APP_VERSION}`}</Typography>
                <Typography>{`${t("aboutDialog.license")}: BSD-3-Clause`}</Typography>
                <Link
                    href="https://github.com/MaibornWolff/ThreatSea"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
                >
                    <GitHub fontSize="small" />
                    {t("aboutDialog.repository")}
                </Link>
            </Box>
            <DialogActions sx={{ justifyContent: "center", paddingTop: 1.5, paddingBottom: 0 }}>
                <Button data-testid="close-button" sx={{ marginRight: 0 }} onClick={onClose}>
                    {t("aboutDialog.close")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
