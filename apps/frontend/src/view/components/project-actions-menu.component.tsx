import Delete from "@mui/icons-material/Delete";
import Edit from "@mui/icons-material/Edit";
import MoreVert from "@mui/icons-material/MoreVert";
import DriveFileMove from "@mui/icons-material/DriveFileMove";
import { Menu, MenuItem } from "@mui/material";
import { useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { checkUserRole, USER_ROLES } from "#api/types/user-roles.types.ts";
import { useProjectExport } from "#application/hooks/use-export.hook.ts";
import type { ExtendedProject } from "#api/types/project.types.ts";
import { ExportIconButton } from "./export-icon-button.component";
import { IconButton } from "./icon-button.component";

interface ProjectActionsMenuProps {
    project: ExtendedProject;
    onClickEditProject: (event: MouseEvent<HTMLElement>, project: ExtendedProject) => void;
    onClickDeleteProject: (event: MouseEvent<HTMLElement>, project: ExtendedProject) => void;
    testIdPrefix: string;
    variant?: "card" | "header";
}

export const ProjectActionsMenu = ({
    project,
    onClickEditProject,
    onClickDeleteProject,
    testIdPrefix,
    variant = "card",
}: ProjectActionsMenuProps) => {
    const isHeader = variant === "header";
    const { t } = useTranslation("projectsPage");
    const navigate = useNavigate();
    const [anchorElement, setAnchorElement] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorElement);

    // Owner-only actions (edit/export/delete). "Move to folder" is per-user placement, so it is
    // available to any member — a viewer organizes their own view without owning the project.
    const isOwner = checkUserRole(project.role, USER_ROLES.OWNER);

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

    const handleMoveProject = () => {
        navigate("/projects/move", { state: { project } });
        handleClose();
    };

    return (
        <>
            <IconButton
                size={isHeader ? "medium" : "small"}
                onClick={handleClick}
                sx={isHeader ? { ml: 1, color: "text.primary" } : undefined}
                data-testid={`${testIdPrefix}-button`}
            >
                <MoreVert sx={{ fontSize: isHeader ? "1rem" : 18 }} />
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
                {isOwner && (
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
                )}
                {!isHeader && (
                    <MenuItem
                        title={t("folders.moveToFolder")}
                        onClick={handleMoveProject}
                        sx={{
                            "&:hover": {
                                backgroundColor: "background.mainIntransparent",
                                color: "secondary.light",
                            },
                        }}
                        data-testid={`${testIdPrefix}_move-project-button`}
                    >
                        <IconButton>
                            <DriveFileMove />
                        </IconButton>
                    </MenuItem>
                )}
                {isOwner && (
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
                        <ExportIconButton fontSize={"inherit"} />
                    </MenuItem>
                )}
                {isOwner && (
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
                )}
            </Menu>
        </>
    );
};
