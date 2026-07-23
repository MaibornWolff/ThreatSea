import { useLocation, type Location } from "react-router";
import type { Folder } from "#api/types/folder.types.ts";
import FolderDialog from "#view/dialogs/folder.dialog.tsx";

interface FolderDialogLocationState {
    // Present when renaming an existing folder.
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
    const { state } = useLocation() as Location<FolderDialogLocationState | undefined>;
    return <FolderDialog open={true} folder={state?.folder} parentId={state?.parentId ?? null} />;
};

export default FolderDialogPage;
