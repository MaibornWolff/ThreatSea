import { type SyntheticEvent, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { checkUserRole, USER_ROLES } from "../../api/types/user-roles.types";
import type { ToggleButtonConfig } from "../../view/components/toggle-buttons.component";
import { useAppSelector } from "./use-app-redux.hook";

export interface ProjectTabs {
    showProjectTabs: boolean;
    finalButtons: ToggleButtonConfig[];
    finalOnChangePath: (event: SyntheticEvent, path: string) => void;
    pathname: string;
}

export const useProjectTabs = (): ProjectTabs => {
    const { projectId, catalogId } = useParams();
    const { pathname, state } = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation("mainMenu");

    const showProjectCatalogueInnerNavigation = useAppSelector(
        (state) => state.navigation.showProjectCatalogueInnerNavigation
    );
    const showUniversalHeaderNavigation = useAppSelector((state) => state.navigation.showUniversalHeaderNavigation);
    const userProjectRole = useAppSelector((state) => state.projects.current?.role);
    const userCatalogRole = useAppSelector((state) => state.catalogs.current?.role);
    const userRole = userProjectRole ?? userCatalogRole;

    const defaultOnChangePath = useCallback(
        (_event: SyntheticEvent, path: string) => {
            if (path != null) {
                navigate(path);
            }
        },
        [navigate]
    );

    const projectOnChangePath = useCallback(
        (_event: SyntheticEvent, path: string) => {
            if (path != null) {
                const nextState = path === "/projects" ? null : state;
                navigate(path, { state: nextState });
            }
        },
        [navigate, state]
    );

    if (!showUniversalHeaderNavigation) {
        return {
            showProjectTabs: false,
            finalButtons: [],
            finalOnChangePath: defaultOnChangePath,
            pathname,
        };
    }

    let defaultProjectButtons: ToggleButtonConfig[] = [
        {
            value: `/projects/${projectId}/system`,
            text: t("system"),
            "data-testid": "navigation-header_system-button",
        },
        {
            value: `/projects/${projectId}/assets`,
            text: t("assets"),
            "data-testid": "navigation-header_assets-button",
        },
        {
            value: `/projects/${projectId}/threats`,
            text: t("threats"),
            "data-testid": "navigation-header_threats-button",
        },
        {
            value: `/projects/${projectId}/measures`,
            text: t("measures"),
            "data-testid": "navigation-header_measures-button",
        },
        {
            value: `/projects/${projectId}/risk`,
            text: t("risk"),
            "data-testid": "navigation-header_risk-button",
        },
        {
            value: `/projects/${projectId}/report`,
            text: t("report"),
            "data-testid": "navigation-header_report-button",
        },
        {
            value: `/projects/${projectId}/members`,
            text: t("member"),
            "data-testid": "navigation-header_members-button",
        },
    ];

    if (!checkUserRole(userRole, USER_ROLES.EDITOR)) {
        defaultProjectButtons = defaultProjectButtons.filter((button) => !String(button.value).includes("members"));
    }

    let finalButtons: ToggleButtonConfig[] = [];
    let finalOnChangePath = defaultOnChangePath;

    if (showProjectCatalogueInnerNavigation) {
        if (pathname.includes("/catalogs")) {
            // Catalog inner page exposes only the members button; consumers render it
            // inline alongside the primary toggle when finalButtons.length === 1.
            if (!checkUserRole(userRole, USER_ROLES.EDITOR)) {
                finalButtons = [];
            } else {
                const button = defaultProjectButtons.at(-1);
                if (button) {
                    finalButtons = [{ ...button, value: `/catalogs/${catalogId}/members` }];
                }
            }
        } else {
            finalButtons = defaultProjectButtons;
            finalOnChangePath = projectOnChangePath;
        }
    }

    const showProjectTabs = Boolean(showProjectCatalogueInnerNavigation) && finalButtons.length > 0;

    return { showProjectTabs, finalButtons, finalOnChangePath, pathname };
};
