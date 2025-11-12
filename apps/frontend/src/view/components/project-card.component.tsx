import { Delete, Edit, ExpandLess, ExpandMore, MoreVert, GppGood } from "@mui/icons-material";
import {
    Box,
    Button as MaterialButton,
    Collapse,
    Menu,
    MenuItem,
    Typography,
    type SxProps,
    type Theme,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { checkUserRole, USER_ROLES } from "../../api/types/user-roles.types";
import { Button } from "./button.component";
import { IconButton } from "./icon-button.component";
import { ExportIconButton } from "./export-icon-button.component";
import { useProjectExport } from "../../application/hooks/use-export.hook";
import type { ExtendedProject } from "../../api/types/project.types";

interface ProjectCardProps {
    project: ExtendedProject;
    onClickEditProject: (event: React.MouseEvent<HTMLElement, MouseEvent>, project: ExtendedProject) => void;
    onClickDeleteProject: (event: React.MouseEvent<HTMLElement, MouseEvent>, project: ExtendedProject) => void;
    sx?: SxProps<Theme>;
}

export const ProjectCard = ({ project, onClickEditProject, onClickDeleteProject, sx = {} }: ProjectCardProps) => {
    const { t } = useTranslation("projectsPage");
    const navigate = useNavigate();
    const { id, name, createdAt, description, image, confidentialityLevel } = project;
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [showDescription, setShowDescription] = useState(false);
    const open = Boolean(anchorEl);

    const { exportProject } = useProjectExport();

    const projectCreationDate = new Date(createdAt);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleEditProject = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        onClickEditProject(event, project);
        handleClose();
    };

    const handleDeleteProject = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        onClickDeleteProject(event, project);
        handleClose();
    };

    const handleClickShowDescription = () => {
        setShowDescription(!showDescription);
    };

    const onClickOpenEditor = () => {
        navigate(`/projects/${id}/system`, {
            state: { project, shouldCenter: true },
        });
    };

    const onClickOpenThreats = () => {
        navigate(`/projects/${id}/threats`, { state: { project } });
    };

    const onClickOpenAssets = () => {
        navigate(`/projects/${id}/assets`, { state: { project } });
    };

    const onClickOpenMeasures = () => {
        navigate(`/projects/${id}/measures`, { state: { project } });
    };

    const onClickOpenRisk = () => {
        navigate(`/projects/${id}/risk`, { state: { project } });
    };

    const onClickOpenReport = () => {
        navigate(`/projects/${id}/report`, { state: { project } });
    };

    const onClickOpenMembers = () => {
        navigate(`/projects/${id}/members`, { state: { project } });
    };

    const handleExport = () => {
        exportProject(project);
    };

    return (
        <Box
            sx={{
                borderRadius: 5,
                bgcolor: "background.paper",
                boxShadow: 1,
                p: 2,
                "&:hover": {
                    bgcolor: "#fff",
                },
                ...sx,
            }}
            data-testid="projects-page_project-card"
        >
            <Box sx={{ mb: 2 }}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <Typography
                        sx={{
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            width: "100%",
                            overflow: "hidden",
                            fontWeight: "bold",
                            fontSize: "0.875rem",
                        }}
                        data-testid="projects-page_project-card_project-name"
                    >
                        {name}
                    </Typography>
                    {checkUserRole(project.role, USER_ROLES.OWNER) && [
                        <IconButton
                            key={"iconbutton" + project.id}
                            size="small"
                            onClick={handleClick}
                            data-testid="projects-page_project-card_action-menu-button"
                        >
                            <MoreVert sx={{ fontSize: 18 }} />
                        </IconButton>,

                        <Menu
                            key={"menu" + project.id}
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleClose}
                            MenuListProps={{
                                sx: { bgcolor: "background.mainIntransparent" },
                            }}
                            PaperProps={{
                                sx: {
                                    borderRadius: 5,
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
                                data-testid="projects-page_project-card_action-menu_edit-project-button"
                            >
                                {" "}
                                <IconButton>
                                    <Edit />
                                </IconButton>{" "}
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
                                data-testid="projects-page_project-card_action-menu_export-project-button"
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
                                data-testid="projects-page_project-card_action-menu_delete-project-button"
                            >
                                <IconButton
                                    sx={{
                                        "&:hover": {
                                            color: "#ef5350",
                                            backgroundColor: "background.paperIntransparent",
                                        },
                                    }}
                                >
                                    <Delete />
                                </IconButton>{" "}
                            </MenuItem>
                        </Menu>,
                    ]}
                </Box>
                <Typography
                    variant="body2"
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        width: "fit-content",
                        fontWeight: "light",
                    }}
                >
                    {t("confidentialityLevels." + confidentialityLevel)}
                    <GppGood
                        sx={{
                            fontSize: "20px",
                            color: "green",
                            marginRight: "5px",
                        }}
                    />
                </Typography>
                <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
                    {projectCreationDate.toISOString().split("T")[0]}
                </Typography>
            </Box>
            <Box
                sx={{
                    border: "1px solid",
                    borderColor: "background.main",
                    borderRadius: 5,
                    height: 200,
                    mb: 2,
                    backgroundImage: `url(${image})`,
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                    "&:hover": {
                        cursor: "pointer",
                        bgcolor: "secondary.light",
                    },
                }}
                onClick={onClickOpenEditor}
            ></Box>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                }}
            >
                <Button
                    onClick={onClickOpenEditor}
                    color="secondary"
                    variant="text"
                    sx={{ fontWeight: "bold", minWidth: "70px" }}
                    data-testid="projects-page_project-card_system-button"
                >
                    {t("system")}
                </Button>
                <Button
                    onClick={onClickOpenAssets}
                    color="secondary"
                    variant="text"
                    sx={{ fontWeight: "bold", minWidth: "70px" }}
                    data-testid="projects-page_project-card_assets-button"
                >
                    {t("assets")}
                </Button>
                <Button
                    onClick={onClickOpenThreats}
                    color="secondary"
                    variant="text"
                    sx={{ fontWeight: "bold", minWidth: "70px" }}
                    data-testid="projects-page_project-card_threats-button"
                >
                    {t("threats")}
                </Button>
                <Button
                    onClick={onClickOpenMeasures}
                    color="secondary"
                    variant="text"
                    sx={{ fontWeight: "bold", minWidth: "70px" }}
                    data-testid="projects-page_project-card_measures-button"
                >
                    {t("measures")}
                </Button>
                <Button
                    onClick={onClickOpenRisk}
                    color="secondary"
                    variant="text"
                    sx={{ fontWeight: "bold", minWidth: "70px" }}
                    data-testid="projects-page_project-card_risk-button"
                >
                    {t("risk")}
                </Button>
                <Button
                    onClick={onClickOpenReport}
                    color="secondary"
                    variant="text"
                    sx={{ fontWeight: "bold", minWidth: "70px" }}
                    data-testid="projects-page_project-card_report-button"
                >
                    {t("report")}
                </Button>
                {checkUserRole(project.role, USER_ROLES.EDITOR) && (
                    <Button
                        onClick={onClickOpenMembers}
                        color="secondary"
                        variant="text"
                        sx={{
                            fontWeight: "bold",
                            minWidth: "70px",
                            marginRight: 0,
                        }}
                        data-testid="projects-page_project-card_members-button"
                    >
                        {t("members")}
                    </Button>
                )}
            </Box>
            <MaterialButton
                startIcon={
                    showDescription ? (
                        <ExpandLess sx={{ fontSize: 18 }} color="primary" />
                    ) : (
                        <ExpandMore sx={{ fontSize: 18 }} color="primary" />
                    )
                }
                sx={{
                    display: "flex",
                    alignItems: "center",
                    borderRadius: 5,
                    marginTop: 2,
                    "&:hover": {
                        backgroundColor: "primary.light",
                    },
                }}
                onClick={handleClickShowDescription}
                data-testid="projects-page_project-card_description-expander"
            >
                <Typography
                    variant="button"
                    sx={{
                        textTransform: "initial",
                        fontSize: "0.75rem",
                        "&:hover": { cursor: "pointer" },
                    }}
                >
                    {t("description")}
                </Typography>
            </MaterialButton>
            <Collapse in={showDescription}>
                <Typography
                    sx={{
                        wordWrap: "break-word",
                        fontSize: "0.75rem",
                        marginLeft: 1,
                    }}
                    data-testid="projects-page_project-card_project-description"
                >
                    {description}
                </Typography>
            </Collapse>
        </Box>
    );
};
