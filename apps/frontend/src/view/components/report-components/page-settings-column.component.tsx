import { FormControl, FormControlLabel, Switch, Typography, Box } from "@mui/material";
import type { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";

export interface PageToggle {
    id: string;
    checked: boolean;
    onChange: (event: ChangeEvent<HTMLInputElement>, checked: boolean) => void;
}

interface PageSettingsColumnProps {
    toggles: PageToggle[];
}

export const PageSettingsColumn = ({ toggles }: PageSettingsColumnProps) => {
    const { t } = useTranslation("reportPage");

    return (
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
            {toggles.map(({ id, checked, onChange }) => (
                <FormControl key={id} sx={{ margin: 0, marginBottom: 1 }}>
                    <FormControlLabel
                        control={<Switch checked={checked} onChange={onChange} />}
                        label={<Typography sx={{ fontSize: "0.875rem" }}>{t(id)}</Typography>}
                        labelPlacement="end"
                    />
                </FormControl>
            ))}
        </Box>
    );
};
