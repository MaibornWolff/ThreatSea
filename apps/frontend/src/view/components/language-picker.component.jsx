import { Box, Typography, Menu, MenuItem, Button } from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocalStorage } from "../../application/hooks/use-local-storage.hook";

const LANGUAGES = [
    {
        id: "de",
        label: "DE",
    },
    {
        id: "en",
        label: "EN",
    },
];
let currentLanguageIndex = 0;

export const LanguagePicker = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [currentLanguage, setCurrentLanguage] = useLocalStorage("lang", "en");
    const { i18n } = useTranslation();
    const open = Boolean(anchorEl);

    const handleClick = () => {
        currentLanguageIndex = getLanguageIndexForLanguage(currentLanguage);
        currentLanguageIndex++;
        if (currentLanguageIndex >= LANGUAGES.length) {
            currentLanguageIndex = 0;
        }

        setCurrentLanguage(LANGUAGES[currentLanguageIndex].id);
    };

    const getLanguageIndexForLanguage = (language) => {
        for (let i = 0; i < LANGUAGES.length; i++) {
            if (LANGUAGES[i].id == language) {
                return i;
            }
        }
        return 0;
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSelect = (e, value) => {
        setAnchorEl(null);
        setCurrentLanguage(value);
    };

    useEffect(() => {
        currentLanguageIndex = getLanguageIndexForLanguage(currentLanguage);
    }, [currentLanguage]);

    useEffect(() => {
        i18n.changeLanguage(currentLanguage);
    }, [i18n, currentLanguage]);

    const languageLabel = LANGUAGES[currentLanguageIndex]?.label || "-";

    return (
        <Box sx={{ ml: 2, mr: 2 }}>
            <Button
                onClick={handleClick}
                disableRipple={true}
                sx={{
                    color: "languagePicker.color",
                    "&:hover": {
                        color: "primary.light",
                        backgroundColor: "#00000000",
                    },
                }}
            >
                <LanguageIcon sx={{ fontSize: 18 }} />
                <Typography
                    sx={{
                        ml: 0.35,
                        fontSize: "0.875rem",
                    }}
                >
                    {languageLabel}
                </Typography>
            </Button>
            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                {Object.values(LANGUAGES).map((language, i) => {
                    const { label, id } = language;
                    return (
                        <MenuItem key={i} onClick={(e) => handleSelect(e, id)}>
                            {label}
                        </MenuItem>
                    );
                })}
            </Menu>
        </Box>
    );
};
