/**
 * @module move-to-folder.dialog - Folder picker for moving a project into a folder, or moving a
 * folder under another parent. The same dialog serves both: pass `project` or `folder`.
 *
 * For a folder move it disables invalid targets up front (the folder itself, its descendants, or a
 * target that would push the moved subtree past the maximum depth); the backend enforces the same
 * rules authoritatively.
 */
import { DialogActions, DialogTitle, List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import type { DialogProps } from "@mui/material/Dialog";
import FolderIcon from "@mui/icons-material/Folder";
import Home from "@mui/icons-material/Home";
import Inbox from "@mui/icons-material/Inbox";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import type { Folder } from "#api/types/folder.types.ts";
import type { ExtendedProject } from "#api/types/project.types.ts";
import { FoldersActions } from "#application/actions/folders.actions.ts";
import { useAppDispatch } from "#application/hooks/use-app-redux.hook.ts";
import { useFolders } from "#application/hooks/use-folders.hook.ts";
import {
    buildFolderTree,
    folderChildrenMap,
    folderDescendantIds,
    folderSubtreeHeight,
    MAX_FOLDER_DEPTH,
    type FolderTreeNode,
} from "#utils/build-folder-tree.ts";
import { Button } from "#view/components/button.component.tsx";
import { Dialog } from "#view/components/dialog.component.tsx";

interface MoveToFolderDialogProps extends DialogProps {
    project: ExtendedProject | undefined;
    folder: Folder | undefined;
}

const flatten = (nodes: FolderTreeNode[]): { folder: Folder; depth: number }[] =>
    nodes.flatMap((node) => [{ folder: node.folder, depth: node.depth }, ...flatten(node.children)]);

const MoveToFolderDialog = ({ project, folder, ...props }: MoveToFolderDialogProps) => {
    const { t } = useTranslation("projectsPage");
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { items: folders } = useFolders();

    const isFolderMode = folder !== undefined;
    const movingName = isFolderMode ? folder.name : (project?.name ?? "");
    const currentTargetId = isFolderMode ? folder.parentId : (project?.folderId ?? null);

    const [selected, setSelected] = useState<number | null>(currentTargetId);

    const flatFolders = useMemo(() => flatten(buildFolderTree(folders, []).roots), [folders]);

    // For a folder move, precompute what makes a target illegal so the list can disable it.
    const constraints = useMemo(() => {
        if (!isFolderMode) {
            return { blockedIds: new Set<number>(), height: 0 };
        }
        const childrenOf = folderChildrenMap(folders);
        const blockedIds = folderDescendantIds(folder.id, childrenOf);
        blockedIds.add(folder.id);
        return { blockedIds, height: folderSubtreeHeight(folder.id, childrenOf) };
    }, [isFolderMode, folder, folders]);

    const isTargetDisabled = (targetId: number | null, targetDepth: number): boolean => {
        if (!isFolderMode) {
            return false;
        }
        if (targetId !== null && constraints.blockedIds.has(targetId)) {
            return true;
        }
        const parentDepth = targetId === null ? 0 : targetDepth;
        return parentDepth + constraints.height > MAX_FOLDER_DEPTH;
    };

    const closeDialog = () => navigate(-1);

    const handleMove = () => {
        if (isFolderMode) {
            dispatch(FoldersActions.updateFolder({ id: folder.id, parentId: selected }));
        } else if (project) {
            dispatch(FoldersActions.moveProject({ projectId: project.id, folderId: selected }));
        }
        closeDialog();
    };

    return (
        <Dialog
            onClose={(_event, reason) => {
                if (reason === "backdropClick") {
                    closeDialog();
                }
            }}
            maxWidth="xs"
            fullWidth
            {...props}
            open={true}
        >
            <DialogTitle sx={{ padding: 0, fontSize: "0.875rem", marginBottom: 1, fontWeight: "bold" }}>
                {t("folders.moveTitle", { name: movingName })}
            </DialogTitle>

            <List sx={{ maxHeight: 320, overflowY: "auto", paddingY: 0 }}>
                <ListItemButton
                    selected={selected === null}
                    onClick={() => setSelected(null)}
                    data-testid="move-target-root"
                >
                    <ListItemIcon sx={{ minWidth: 34 }}>
                        {isFolderMode ? (
                            <Home sx={{ fontSize: 20, color: "text.subtle" }} />
                        ) : (
                            <Inbox sx={{ fontSize: 20, color: "text.subtle" }} />
                        )}
                    </ListItemIcon>
                    <ListItemText primary={isFolderMode ? t("folders.moveRootFolder") : t("folders.ungrouped")} />
                </ListItemButton>

                {flatFolders.map(({ folder: targetFolder, depth }) => (
                    <ListItemButton
                        key={targetFolder.id}
                        disabled={isTargetDisabled(targetFolder.id, depth)}
                        selected={selected === targetFolder.id}
                        onClick={() => setSelected(targetFolder.id)}
                        sx={{ paddingLeft: 2 + depth * 2 }}
                        data-testid={`move-target-${targetFolder.id}`}
                    >
                        <ListItemIcon sx={{ minWidth: 34 }}>
                            <FolderIcon sx={{ fontSize: 20, color: "secondary.main" }} />
                        </ListItemIcon>
                        <ListItemText
                            primary={targetFolder.name}
                            slotProps={{ primary: { sx: { fontSize: "0.875rem" } } }}
                        />
                    </ListItemButton>
                ))}
            </List>

            <DialogActions sx={{ paddingRight: 0, paddingBottom: 0, paddingTop: 1.5, paddingLeft: 0 }}>
                <Button data-testid="cancel-button" sx={{ marginRight: 0 }} onClick={closeDialog}>
                    {t("projectDialogPage:cancelBtn")}
                </Button>
                <Button
                    data-testid="save-button"
                    sx={{ marginRight: 0 }}
                    onClick={handleMove}
                    color="success"
                    disabled={selected === currentTargetId}
                >
                    {t("folders.moveButton")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default MoveToFolderDialog;
