/**
 * @module translation.wrapper - Defines the translation wrapper.
 */

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
export const Translations = ({ children }) => <I18nextProvider i18n={translationUtil}>{children}</I18nextProvider>;
