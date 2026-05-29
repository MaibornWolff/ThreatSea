import Box from "@mui/material/Box";
import type { ProjectTabs } from "#application/hooks/use-project-tabs.hook.ts";
import { ButtonNavigation } from "./header-button-navigation.component";

interface HeaderProjectTabsProps {
    projectTabs: ProjectTabs;
}

export const HeaderProjectTabs = ({ projectTabs }: HeaderProjectTabsProps) => {
    const { showProjectTabs, finalButtons, finalOnChangePath, pathname } = projectTabs;

    if (!showProjectTabs || finalButtons.length <= 1) {
        return null;
    }

    return (
        <Box
            sx={{
                gridArea: "tabs",
                justifySelf: "center",
                display: "flex",
                alignItems: "center",
            }}
        >
            <ButtonNavigation size="medium" value={pathname} onChange={finalOnChangePath} buttons={finalButtons} />
        </Box>
    );
};
