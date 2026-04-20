import i18next from "i18next";
import { initReactI18next } from "react-i18next";

// Lightweight i18next instance for tests – avoids the top-level localStorage.getItem()
// call in the real translations.ts that fails before jsdom is fully initialised.
void i18next.use(initReactI18next).init({
    lng: "en",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any);

export const translationUtil = i18next;
