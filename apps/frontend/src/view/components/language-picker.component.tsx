import { Box, Typography, Button } from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocalStorage } from "#application/hooks/use-local-storage.hook.ts";
import { getPreferredLanguage } from "#utils/translations.ts";

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

export const LanguagePicker = () => {
    const [currentLanguage, setCurrentLanguage] = useLocalStorage(
        "lang",
        getPreferredLanguage(LANGUAGES.map((l) => l.id))
    );
    const { i18n } = useTranslation();

    const handleClick = () => {
        const nextLanguageIndex = (getLanguageIndexForLanguage(currentLanguage) + 1) % LANGUAGES.length;

        const newLanguage = LANGUAGES[nextLanguageIndex];
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
        i18n.changeLanguage(currentLanguage);
    }, [i18n, currentLanguage]);

    const languageLabel = LANGUAGES.find((language) => language.id === currentLanguage)?.label ?? "-";

    return (
        <Box sx={{ ml: 2, mr: 2 }}>
            <Button
                onClick={handleClick}
                disableRipple={true}
                sx={{
                    color: "languagePicker.color",
                    "&:hover": {
                        color: "primary.light",
                        backgroundColor: "transparent",
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
