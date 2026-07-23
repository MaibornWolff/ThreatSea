import { useLocation, type Location } from "react-router";
import type { Folder } from "#api/types/folder.types.ts";
import type { ExtendedProject } from "#api/types/project.types.ts";
import MoveToFolderDialog from "#view/dialogs/move-to-folder.dialog.tsx";

interface MoveDialogLocationState {
    // Exactly one of these is set by the trigger: a project card or a folder section.
    project?: ExtendedProject;
    folder?: Folder;
}

/**
 * on this page a project or a folder can be moved into a folder
 *
 * @component
 * @category Pages
 * @return {Component}
 */
const MoveDialogPage = () => {
    const { state } = useLocation() as Location<MoveDialogLocationState | undefined>;
    return <MoveToFolderDialog open={true} project={state?.project} folder={state?.folder} />;
};

export default MoveDialogPage;
