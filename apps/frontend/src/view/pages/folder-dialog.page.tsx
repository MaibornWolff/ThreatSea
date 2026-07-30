import { useLocation, useParams, type Location } from "react-router";
import type { Folder } from "#api/types/folder.types.ts";
import { useFolders } from "#application/hooks/use-folders.hook.ts";
import FolderDialog from "#view/dialogs/folder.dialog.tsx";

interface FolderDialogLocationState {
    // Present when renaming an existing folder (also carried in the route as :folderId).
    folder?: Folder;
    // Present when creating a new (sub)folder; null means a root-level folder.
    parentId?: number | null;
}

/**
 * on this page a folder can be created or renamed
 *
 * @component
 * @category Pages
 * @return {Component}
 */
const FolderDialogPage = () => {
    const { folderId } = useParams();
    const { state } = useLocation() as Location<FolderDialogLocationState | undefined>;
    const { items: folders } = useFolders();

    // The rename route carries :folderId; the create route (folders/add) does not. Prefer the folder
    // from nav state, falling back to the loaded list so a reload or deep link still resolves it.
    const isRenameRoute = folderId !== undefined;
    const folder = state?.folder ?? folders.find((candidate) => candidate.id === Number(folderId));

    // On reload the folders arrive a beat after this renders; wait for the match rather than mount
    // FolderDialog with no folder (its form captures the empty name once and would stay blank).
    if (isRenameRoute && folder === undefined) {
        return null;
    }

    return <FolderDialog open={true} folder={folder} parentId={state?.parentId ?? null} />;
};

export default FolderDialogPage;
