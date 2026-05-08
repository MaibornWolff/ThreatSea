import Box from "@mui/material/Box";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "../../application/hooks/use-app-redux.hook";
import type { ProjectTabs } from "../../application/hooks/use-project-tabs.hook";
import { ButtonNavigation } from "./header-button-navigation.component";

interface HeaderLevelOneNavProps {
    projectTabs: ProjectTabs;
}

export const HeaderLevelOneNav = ({ projectTabs }: HeaderLevelOneNavProps) => {
    const { t } = useTranslation("mainMenu");
    const showUniversalHeaderNavigation = useAppSelector((state) => state.navigation.showUniversalHeaderNavigation);
    const { showProjectTabs, finalButtons, finalOnChangePath, pathname } = projectTabs;

    const showLevelOne = showUniversalHeaderNavigation;
    const inlineSingleTab = showProjectTabs && finalButtons.length === 1;

    if (!showLevelOne && !inlineSingleTab) {
        return null;
    }

    return (
        <Box
            sx={{
                gridArea: "levelOne",
                justifySelf: "center",
                display: "flex",
                alignItems: "center",
                gap: 1,
            }}
        >
            {showLevelOne && (
                <ButtonNavigation
                    value={pathname}
                    onChange={finalOnChangePath}
                    buttonProps={{
                        width: { xs: "auto", md: "100px" },
                    }}
                    buttons={[
                        {
                            value: "/projects",
                            text: t("projects"),
                            "data-testid": "navigation-header_projects-page-button",
                        },
                        {
                            value: "/catalogs",
                            text: t("catalogs"),
                            "data-testid": "navigation-header_catalogs-page-button",
                        },
                    ]}
                />
            )}
            {inlineSingleTab && (
                <ButtonNavigation size="medium" value={pathname} onChange={finalOnChangePath} buttons={finalButtons} />
            )}
        </Box>
    );
};
