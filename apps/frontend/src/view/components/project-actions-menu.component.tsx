import { Delete, Edit, MoreVert } from "@mui/icons-material";
import { Menu, MenuItem, type SxProps, type Theme } from "@mui/material";
import { useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { useProjectExport } from "#application/hooks/use-export.hook.ts";
import type { ExtendedProject } from "#api/types/project.types.ts";
import { ExportIconButton } from "./export-icon-button.component";
import { IconButton } from "./icon-button.component";

interface ProjectActionsMenuProps {
    project: ExtendedProject;
    onClickEditProject: (event: MouseEvent<HTMLElement>, project: ExtendedProject) => void;
    onClickDeleteProject: (event: MouseEvent<HTMLElement>, project: ExtendedProject) => void;
    testIdPrefix: string;
    triggerSx?: SxProps<Theme>;
    triggerIconSx?: SxProps<Theme>;
    triggerSize?: "small" | "medium" | "large";
}

export const ProjectActionsMenu = ({
    project,
    onClickEditProject,
    onClickDeleteProject,
    testIdPrefix,
    triggerSx,
    triggerIconSx = { fontSize: 18 },
    triggerSize = "small",
}: ProjectActionsMenuProps) => {
    const { t } = useTranslation("projectsPage");
    const [anchorElement, setAnchorElement] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorElement);

    const { exportProject } = useProjectExport();

    const handleClick = (event: MouseEvent<HTMLElement>) => {
        setAnchorElement(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorElement(null);
    };

    const handleEditProject = (event: MouseEvent<HTMLElement>) => {
        onClickEditProject(event, project);
        handleClose();
    };

    const handleDeleteProject = (event: MouseEvent<HTMLElement>) => {
        onClickDeleteProject(event, project);
        handleClose();
    };

    const handleExport = () => {
        exportProject(project);
        handleClose();
    };

    return (
        <>
            <IconButton size={triggerSize} onClick={handleClick} sx={triggerSx} data-testid={`${testIdPrefix}-button`}>
                <MoreVert sx={triggerIconSx} />
            </IconButton>
            <Menu
                anchorEl={anchorElement}
                open={open}
                onClose={handleClose}
                slotProps={{
                    list: {
                        sx: { bgcolor: "background.mainIntransparent" },
                    },
                    paper: {
                        sx: {
                            borderRadius: 5,
                        },
                    },
                }}
            >
                <MenuItem
                    title={t("edit")}
                    onClick={handleEditProject}
                    sx={{
                        "&:hover": {
                            backgroundColor: "background.mainIntransparent",
                            color: "secondary.light",
                        },
                    }}
                    data-testid={`${testIdPrefix}_edit-project-button`}
                >
                    <IconButton>
                        <Edit />
                    </IconButton>
                </MenuItem>
                <MenuItem
                    title={t("exportProject")}
                    onClick={handleExport}
                    sx={{
                        "&:hover": {
                            backgroundColor: "background.mainIntransparent",
                            color: "secondary.light",
                        },
                    }}
                    data-testid={`${testIdPrefix}_export-project-button`}
                >
                    <ExportIconButton />
                </MenuItem>
                <MenuItem
                    title={t("delete")}
                    onClick={handleDeleteProject}
                    sx={{
                        "&:hover": {
                            backgroundColor: "background.mainIntransparent",
                        },
                    }}
                    data-testid={`${testIdPrefix}_delete-project-button`}
                >
                    <IconButton
                        sx={{
                            "&:hover": {
                                color: "error.light",
                                backgroundColor: "background.paperIntransparent",
                            },
                        }}
                    >
                        <Delete />
                    </IconButton>
                </MenuItem>
            </Menu>
        </>
    );
};
