import { useState, type MouseEvent } from "react";
import { Box, Collapse, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import {
    ChevronRight,
    CreateNewFolder,
    Delete,
    Edit,
    Folder as FolderIcon,
    Inbox,
    MoreVert,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import type { Folder } from "#api/types/folder.types.ts";
import type { ExtendedProject } from "#api/types/project.types.ts";
import { MAX_FOLDER_DEPTH, type FolderTree, type FolderTreeNode } from "#utils/build-folder-tree.ts";
import { useConfirm } from "#application/hooks/use-confirm.hook.ts";
import { useFolders } from "#application/hooks/use-folders.hook.ts";
import { ProjectsGridComponent } from "./projects-grid.component";

interface ProjectHandlers {
    columnCount: number;
    onClickEditProject: (event: MouseEvent<HTMLElement>, project: ExtendedProject) => void;
    onClickDeleteProject: (event: MouseEvent<HTMLElement>, project: ExtendedProject) => void;
}

const sectionHeaderSx = {
    display: "flex",
    alignItems: "center",
    gap: 1,
    paddingX: 1.5,
    paddingY: 1,
    borderRadius: 2,
    border: 1,
    borderColor: "divider",
    cursor: "pointer",
    userSelect: "none",
    "&:hover": { borderColor: "secondary.main" },
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
    <Box sx={sectionHeaderSx} onClick={onToggle} data-testid={testId}>
        <ChevronRight
            sx={{
                transition: "transform 0.15s ease",
                transform: expanded ? "rotate(90deg)" : "none",
                color: "text.secondary",
            }}
        />
        {icon}
        <Typography sx={{ fontWeight: "bold", fontSize: "0.9rem" }}>{title}</Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {subtitle}
        </Typography>
        {right && (
            <Box
                sx={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 1 }}
                onClick={(e) => e.stopPropagation()}
            >
                {right}
            </Box>
        )}
    </Box>
);

interface FolderSectionProps extends ProjectHandlers {
    node: FolderTreeNode;
    onNewSubfolder: (parentId: number) => void;
    onRename: (folder: Folder) => void;
    onDelete: (node: FolderTreeNode) => void;
}

const FolderSection = ({ node, onNewSubfolder, onRename, onDelete, ...projectHandlers }: FolderSectionProps) => {
    const { t } = useTranslation("projectsPage");
    const [expanded, setExpanded] = useState(true);
    const [anchorElement, setAnchorElement] = useState<null | HTMLElement>(null);
    const menuOpen = Boolean(anchorElement);
    const canNest = node.depth < MAX_FOLDER_DEPTH;

    const closeMenu = () => setAnchorElement(null);

    return (
        <Box sx={{ marginBottom: 1 }} data-testid={`folder-section-${node.folder.id}`}>
            <SectionHeader
                expanded={expanded}
                onToggle={() => setExpanded((value) => !value)}
                icon={<FolderIcon sx={{ color: "secondary.main", fontSize: 20 }} />}
                title={node.folder.name}
                subtitle={t("folders.sectionCount", { projects: node.projects.length, folders: node.children.length })}
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
                        onDelete(node);
                    }}
                    data-testid={`folder-section-${node.folder.id}_delete-button`}
                >
                    <Delete fontSize="small" sx={{ marginRight: 1 }} />
                    {t("folders.deleteFolder")}
                </MenuItem>
            </Menu>
            <Collapse in={expanded}>
                <Box sx={{ paddingLeft: 2, marginTop: 1, borderLeft: 2, borderColor: "divider" }}>
                    {node.projects.length > 0 && (
                        <ProjectsGridComponent projects={node.projects} {...projectHandlers} />
                    )}
                    {node.children.map((child) => (
                        <FolderSection
                            key={child.folder.id}
                            node={child}
                            onNewSubfolder={onNewSubfolder}
                            onRename={onRename}
                            onDelete={onDelete}
                            {...projectHandlers}
                        />
                    ))}
                </Box>
            </Collapse>
        </Box>
    );
};

const UngroupedSection = ({ projects, ...projectHandlers }: ProjectHandlers & { projects: ExtendedProject[] }) => {
    const { t } = useTranslation("projectsPage");
    const [expanded, setExpanded] = useState(true);

    return (
        <Box sx={{ marginBottom: 1 }} data-testid="folder-section-ungrouped">
            <SectionHeader
                expanded={expanded}
                onToggle={() => setExpanded((value) => !value)}
                icon={<Inbox sx={{ color: "text.secondary", fontSize: 20 }} />}
                title={t("folders.ungrouped")}
                subtitle={t("folders.sectionCount", { projects: projects.length, folders: 0 })}
                testId="folder-section-ungrouped_header"
            />
            <Collapse in={expanded}>
                <Box sx={{ marginTop: 1 }}>
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
    const { deleteFolder } = useFolders();
    const { openConfirm } = useConfirm<Folder>();

    const onNewSubfolder = (parentId: number) => navigate("/projects/folders/add", { state: { parentId } });
    const onRename = (folder: Folder) => navigate(`/projects/folders/${folder.id}`, { state: { folder } });

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
                    onNewSubfolder={onNewSubfolder}
                    onRename={onRename}
                    onDelete={onDelete}
                    {...projectHandlers}
                />
            ))}
            {tree.ungrouped.length > 0 && <UngroupedSection projects={tree.ungrouped} {...projectHandlers} />}
        </Box>
    );
};
