import i18next from "i18next";
import deApplyMeasureDialogPage from "../translations/de/apply-measure-dialog-page.de.json";
import deAssetsPage from "../translations/de/assets-page.de.json";
import deCatalogMeasureDialogPage from "../translations/de/catalog-measure-dialog.de.json";
import deCatalogPage from "../translations/de/catalog-page.de.json";
import deCatalogsPage from "../translations/de/catalogs-page.de.json";
import deEditorPage from "../translations/de/editor-page.de.json";
import deErrorBoundary from "../translations/de/error-boundary-page.de.json";
import deLoginPage from "../translations/de/login-page.de.json";
import deMainMenu from "../translations/de/main-menu.de.json";
import deProjectDialogPage from "../translations/de/project-dialog-page.de.json";
import deProjectsPage from "../translations/de/projects-page.de.json";
import deReportPage from "../translations/de/report-page.de.json";
import deRiskPage from "../translations/de/risk-page.de.json";
import deThreatDialogPage from "../translations/de/threat-dialog-page.de.json";
import deThreatsPage from "../translations/de/threats-page.de.json";
import deMeasuresPage from "../translations/de/measures-page.de.json";
import deMemberPage from "../translations/de/member-page.de.json";
import deMemberDialogPage from "../translations/de/member-dialog-page.de.json";
import deMeasureDialog from "../translations/de/measure-dialog-page.de.json";
import deCommon from "../translations/de/common.de.json";
import deReport from "../translations/de/report.de.json";

import enApplyMeasureDialogPage from "../translations/en/apply-measure-dialog-page.en.json";
import enAssetsPage from "../translations/en/assets-page.en.json";
import enCatalogMeasureDialogPage from "../translations/en/catalog-measure-dialog.en.json";
import enCatalogPage from "../translations/en/catalog-page.en.json";
import enCatalogsPage from "../translations/en/catalogs-page.en.json";
import enEditorPage from "../translations/en/editor-page.en.json";
import enErrorBoundary from "../translations/en/error-boundary-page.en.json";
import enLoginPage from "../translations/en/login-page.en.json";
import enMainMenu from "../translations/en/main-menu.en.json";
import enProjectsPage from "../translations/en/projects-page.en.json";
import enProjectDialogPage from "../translations/en/project-dialog-page.en.json";
import enReportPage from "../translations/en/report-page.en.json";
import enRiskPage from "../translations/en/risk-page.en.json";
import enThreatDialogPage from "../translations/en/threat-dialog-page.en.json";
import enThreatsPage from "../translations/en/threats-page.en.json";
import enMeasuresPage from "../translations/en/measures-page.en.json";
import enMemberPage from "../translations/en/member-page.en.json";
import enMemberDialogPage from "../translations/en/member-dialog-page.en.json";
import enMeasureDialog from "../translations/en/measure-dialog-page.en.json";
import enCommon from "../translations/en/common.en.json";
import enReport from "../translations/en/report.en.json";

const cachedLang =
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined" &&
    typeof window.localStorage.getItem === "function"
        ? window.localStorage.getItem("lang")
        : null;

/**
 * Initialises the translation for english and german
 * with i18next.
 */
i18next.init({
    lng: cachedLang ? JSON.parse(cachedLang) : "en",
    interpolation: {
        escapeValue: false,
    },
    fallbackNS: ["common"],
    resources: {
        en: {
            assetsPage: enAssetsPage,
            applyMeasureDialogPage: enApplyMeasureDialogPage,
            projectsPage: enProjectsPage,
            mainMenu: enMainMenu,
            catalogPage: enCatalogPage,
            catalogsPage: enCatalogsPage,
            threatsPage: enThreatsPage,
            measureDialog: enMeasureDialog,
            measuresPage: enMeasuresPage,
            threatDialogPage: enThreatDialogPage,
            editorPage: enEditorPage,
            riskPage: enRiskPage,
            catalogMeasureDialogPage: enCatalogMeasureDialogPage,
            projectDialogPage: enProjectDialogPage,
            reportPage: enReportPage,
            errorBoundary: enErrorBoundary,
            loginPage: enLoginPage,
            memberPage: enMemberPage,
            memberDialogPage: enMemberDialogPage,
            common: enCommon,
            report: enReport,
        },
        de: {
            assetsPage: deAssetsPage,
            applyMeasureDialogPage: deApplyMeasureDialogPage,
            projectsPage: deProjectsPage,
            mainMenu: deMainMenu,
            catalogPage: deCatalogPage,
            catalogsPage: deCatalogsPage,
            threatsPage: deThreatsPage,
            measureDialog: deMeasureDialog,
            measuresPage: deMeasuresPage,
            threatDialogPage: deThreatDialogPage,
            editorPage: deEditorPage,
            riskPage: deRiskPage,
            projectDialogPage: deProjectDialogPage,
            catalogMeasureDialogPage: deCatalogMeasureDialogPage,
            reportPage: deReportPage,
            errorBoundary: deErrorBoundary,
            loginPage: deLoginPage,
            memberPage: deMemberPage,
            memberDialogPage: deMemberDialogPage,
            common: deCommon,
            report: deReport,
        },
    },
});

export const translationUtil = i18next;
