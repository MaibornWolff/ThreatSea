import { useState, type MouseEvent } from "react";
import { Box, Collapse, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import ChevronRight from "@mui/icons-material/ChevronRight";
import CreateNewFolder from "@mui/icons-material/CreateNewFolder";
import Delete from "@mui/icons-material/Delete";
import DriveFileMove from "@mui/icons-material/DriveFileMove";
import Edit from "@mui/icons-material/Edit";
import FolderIcon from "@mui/icons-material/Folder";
import Inbox from "@mui/icons-material/Inbox";
import MoreVert from "@mui/icons-material/MoreVert";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import type { Folder } from "#api/types/folder.types.ts";
import type { ExtendedProject } from "#api/types/project.types.ts";
import { MAX_FOLDER_DEPTH, type FolderTree, type FolderTreeNode } from "#utils/build-folder-tree.ts";
import { FoldersActions } from "#application/actions/folders.actions.ts";
import { useConfirm } from "#application/hooks/use-confirm.hook.ts";
import { useFolders } from "#application/hooks/use-folders.hook.ts";
import { useAppDispatch, useAppSelector } from "#application/hooks/use-app-redux.hook.ts";
import { ProjectsGridComponent } from "./projects-grid.component";

const UNGROUPED_KEY = "ungrouped";

interface ProjectHandlers {
    columnCount: number;
    onClickEditProject: (event: MouseEvent<HTMLElement>, project: ExtendedProject) => void;
    onClickDeleteProject: (event: MouseEvent<HTMLElement>, project: ExtendedProject) => void;
}

const sectionHeaderSx = {
    display: "flex",
    alignItems: "center",
    gap: 1,
    paddingX: 2,
    paddingY: 1.25,
    bgcolor: "background.paper",
    cursor: "pointer",
    userSelect: "none",
    "&:hover": { bgcolor: "background.paperWhite" },
} as const;

const sectionBodySx = {
    padding: 2,
    bgcolor: "background.listItem",
} as const;

const sectionContainerSx = {
    marginBottom: 1,
    borderRadius: 5,
    boxShadow: 1,
    overflow: "hidden",
} as const;

const SectionHeader = ({
    expanded,
    icon,
    title,
    subtitle,
    right,
    onToggle,
    testId,
}: {
    expanded: boolean;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    right?: React.ReactNode;
    onToggle: () => void;
    testId: string;
}) => (
    <Box
        sx={sectionHeaderSx}
        onClick={onToggle}
        onKeyDown={(event) => {
            // Only react to keys pressed on the header itself — keydown from nested controls
            // (the kebab button) bubbles up here and must keep its native activation.
            if (event.target !== event.currentTarget) {
                return;
            }
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onToggle();
            }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        data-testid={testId}
    >
        <ChevronRight
            sx={{
                transition: "transform 0.15s ease",
                transform: expanded ? "rotate(90deg)" : "none",
                color: "text.subtle",
            }}
        />
        {icon}
        <Typography sx={{ fontWeight: "bold", fontSize: "0.9rem" }}>{title}</Typography>
        <Typography variant="caption" sx={{ color: "text.subtle" }}>
            {subtitle}
        </Typography>
        {right && (
            <Box
                sx={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 1 }}
                onClick={(event) => event.stopPropagation()}
            >
                {right}
            </Box>
        )}
    </Box>
);

interface FolderSectionProps extends ProjectHandlers {
    node: FolderTreeNode;
    collapsed: Record<string, boolean>;
    onToggleCollapsed: (key: string) => void;
    onNewSubfolder: (parentId: number) => void;
    onRename: (folder: Folder) => void;
    onMove: (folder: Folder) => void;
    onDelete: (node: FolderTreeNode) => void;
}

const FolderSection = ({
    node,
    collapsed,
    onToggleCollapsed,
    onNewSubfolder,
    onRename,
    onMove,
    onDelete,
    ...projectHandlers
}: FolderSectionProps) => {
    const { t } = useTranslation("projectsPage");
    const [anchorElement, setAnchorElement] = useState<null | HTMLElement>(null);
    const menuOpen = Boolean(anchorElement);
    const canNest = node.depth < MAX_FOLDER_DEPTH;
    const sectionKey = String(node.folder.id);
    const expanded = !collapsed[sectionKey];

    const closeMenu = () => setAnchorElement(null);

    return (
        <Box sx={sectionContainerSx} data-testid={`folder-section-${node.folder.id}`}>
            <SectionHeader
                expanded={expanded}
                onToggle={() => onToggleCollapsed(sectionKey)}
                icon={<FolderIcon sx={{ color: "secondary.main", fontSize: 20 }} />}
                title={node.folder.name}
                subtitle={`${t("folders.projectCount", { count: node.projects.length })} · ${t("folders.folderCount", { count: node.children.length })}`}
                testId={`folder-section-${node.folder.id}_header`}
                right={
                    <IconButton
                        size="small"
                        onClick={(event) => setAnchorElement(event.currentTarget)}
                        data-testid={`folder-section-${node.folder.id}_menu-button`}
                    >
                        <MoreVert sx={{ fontSize: 18 }} />
                    </IconButton>
                }
            />
            <Menu
                slotProps={{
                    list: {
                        sx: { bgcolor: "background.mainIntransparent" },
                    },
                }}
                anchorEl={anchorElement}
                open={menuOpen}
                onClose={closeMenu}
            >
                <MenuItem
                    disabled={!canNest}
                    onClick={() => {
                        closeMenu();
                        onNewSubfolder(node.folder.id);
                    }}
                    data-testid={`folder-section-${node.folder.id}_new-subfolder-button`}
                >
                    <CreateNewFolder fontSize="small" sx={{ marginRight: 1 }} />
                    {t("folders.newSubfolder")}
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        closeMenu();
                        onRename(node.folder);
                    }}
                    data-testid={`folder-section-${node.folder.id}_rename-button`}
                >
                    <Edit fontSize="small" sx={{ marginRight: 1 }} />
                    {t("folders.renameFolder")}
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        closeMenu();
                        onMove(node.folder);
                    }}
                    data-testid={`folder-section-${node.folder.id}_move-button`}
                >
                    <DriveFileMove fontSize="small" sx={{ marginRight: 1 }} />
                    {t("folders.moveToFolder")}
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        closeMenu();
                        onDelete(node);
                    }}
                    data-testid={`folder-section-${node.folder.id}_delete-button`}
                >
                    <Delete fontSize="small" sx={{ marginRight: 1 }} />
                    {t("folders.deleteFolder")}
                </MenuItem>
            </Menu>
            <Collapse in={expanded}>
                <Box sx={sectionBodySx}>
                    {node.projects.length > 0 && (
                        <ProjectsGridComponent projects={node.projects} {...projectHandlers} />
                    )}
                    {node.children.map((child) => (
                        <FolderSection
                            key={child.folder.id}
                            node={child}
                            collapsed={collapsed}
                            onToggleCollapsed={onToggleCollapsed}
                            onNewSubfolder={onNewSubfolder}
                            onRename={onRename}
                            onMove={onMove}
                            onDelete={onDelete}
                            {...projectHandlers}
                        />
                    ))}
                </Box>
            </Collapse>
        </Box>
    );
};

const UngroupedSection = ({
    projects,
    expanded,
    onToggleCollapsed,
    ...projectHandlers
}: ProjectHandlers & { projects: ExtendedProject[]; expanded: boolean; onToggleCollapsed: () => void }) => {
    const { t } = useTranslation("projectsPage");

    return (
        <Box sx={sectionContainerSx} data-testid="folder-section-ungrouped">
            <SectionHeader
                expanded={expanded}
                onToggle={onToggleCollapsed}
                icon={<Inbox sx={{ color: "text.subtle", fontSize: 20 }} />}
                title={t("folders.ungrouped")}
                subtitle={t("folders.projectCount", { count: projects.length })}
                testId="folder-section-ungrouped_header"
            />
            <Collapse in={expanded}>
                <Box sx={sectionBodySx}>
                    <ProjectsGridComponent projects={projects} {...projectHandlers} />
                </Box>
            </Collapse>
        </Box>
    );
};

interface FoldersAccordionProps extends ProjectHandlers {
    tree: FolderTree;
}

export const FoldersAccordion = ({ tree, ...projectHandlers }: FoldersAccordionProps) => {
    const { t } = useTranslation("projectsPage");
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { deleteFolder } = useFolders();
    const { openConfirm } = useConfirm<Folder>();
    // Collapse state lives in redux so it survives entering and leaving a project (but not a refresh).
    const collapsed = useAppSelector((state) => state.folders.collapsed);
    const onToggleCollapsed = (key: string) => dispatch(FoldersActions.toggleFolderCollapsed(key));

    const onNewSubfolder = (parentId: number) => navigate("/projects/folders/add", { state: { parentId } });
    const onRename = (folder: Folder) => navigate(`/projects/folders/${folder.id}`, { state: { folder } });
    const onMove = (folder: Folder) => navigate("/projects/move", { state: { folder } });

    const onDelete = (node: FolderTreeNode) => {
        const isNonEmpty = node.children.length > 0 || node.projects.length > 0;
        openConfirm({
            state: node.folder,
            message: isNonEmpty
                ? {
                      preHighlightText: t("folders.deleteNonEmptyPre"),
                      highlightedText: node.folder.name,
                      afterHighlightText: t("folders.deleteNonEmptyPost"),
                  }
                : t("folders.deleteEmptyMessage", { folderName: node.folder.name }),
            acceptText: t("delete"),
            cancelText: t("cancel"),
            onAccept: (folder) => deleteFolder(folder),
        });
    };

    return (
        <Box sx={{ width: "100%", overflowY: "auto", paddingRight: 2 }} data-testid="folders-accordion">
            {tree.roots.map((node) => (
                <FolderSection
                    key={node.folder.id}
                    node={node}
                    collapsed={collapsed}
                    onToggleCollapsed={onToggleCollapsed}
                    onNewSubfolder={onNewSubfolder}
                    onRename={onRename}
                    onMove={onMove}
                    onDelete={onDelete}
                    {...projectHandlers}
                />
            ))}
            {tree.ungrouped.length > 0 && (
                <UngroupedSection
                    projects={tree.ungrouped}
                    expanded={!collapsed[UNGROUPED_KEY]}
                    onToggleCollapsed={() => onToggleCollapsed(UNGROUPED_KEY)}
                    {...projectHandlers}
                />
            )}
        </Box>
    );
};
