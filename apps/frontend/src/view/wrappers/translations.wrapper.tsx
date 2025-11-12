/**
 * @module translation.wrapper - Defines the translation wrapper.
 */

import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { translationUtil } from "../../utils/translations";

/**
 * Creates a translation component for children to apply
 * the translation framework.
 *
 * @param {object} children - Childrenelements to be wrapped
 *     into the translation components.
 * @returns React component to apply language translation to wrapped
 *     children.
 */
interface TranslationsProps {
    children: ReactNode;
}

export const Translations = ({ children }: TranslationsProps) => (
    <I18nextProvider i18n={translationUtil}>{children}</I18nextProvider>
);
