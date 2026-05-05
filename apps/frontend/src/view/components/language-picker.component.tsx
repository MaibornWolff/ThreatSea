import { Box, Typography, Button } from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocalStorage } from "../../application/hooks/use-local-storage.hook";
import { getPreferredLanguage } from "../../utils/translations";

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
    const [currentLanguage, setCurrentLanguage] = useLocalStorage(
        "lang",
        getPreferredLanguage(LANGUAGES.map((l) => l.id))
    );
    const { i18n } = useTranslation();

    const handleClick = () => {
        currentLanguageIndex = getLanguageIndexForLanguage(currentLanguage);
        currentLanguageIndex++;
        if (currentLanguageIndex >= LANGUAGES.length) {
            currentLanguageIndex = 0;
        }

        const newLanguage = LANGUAGES[currentLanguageIndex];
        if (newLanguage) {
            setCurrentLanguage(newLanguage.id);
        }
    };

    const getLanguageIndexForLanguage = (language: string) => {
        for (let i = 0; i < LANGUAGES.length; i++) {
            if (LANGUAGES[i]?.id == language) {
                return i;
            }
        }
        return 0;
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
        </Box>
    );
};
