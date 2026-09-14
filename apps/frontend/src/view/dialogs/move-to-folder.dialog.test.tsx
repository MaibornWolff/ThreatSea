import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FoldersActions } from "#application/actions/folders.actions.ts";
import { createFolder, createProject } from "#test-utils/builders.ts";
import { mockUseFolders } from "#test-utils/mock-hooks.ts";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { MAX_FOLDER_DEPTH } from "#utils/build-folder-tree.ts";
import MoveToFolderDialog from "./move-to-folder.dialog";

// moveProject and updateFolder are async thunks. The real store from
// renderWithProviders would execute them and call the API, so they are stubbed to
// return an inert plain action. The assertions are unchanged: they check what the
// dialog asked for, not what the backend did. restoreMocks puts them back.
const stubAction = (name: "moveProject" | "updateFolder") =>
    vi.spyOn(FoldersActions, name).mockReturnValue({ type: `test/${name}` } as never);

describe("MoveToFolderDialog", () => {
    describe("moving a project", () => {
        it("lists an ungrouped target plus every folder", () => {
            mockUseFolders({
                items: [createFolder({ id: 1, name: "Payments" }), createFolder({ id: 2, name: "Internal" })],
            });

            renderWithProviders(
                <MoveToFolderDialog open project={createProject({ id: 5, folderId: null })} folder={undefined} />
            );

            expect(screen.getByTestId("move-target-root")).toBeInTheDocument();
            expect(screen.getByTestId("move-target-1")).toBeInTheDocument();
            expect(screen.getByTestId("move-target-2")).toBeInTheDocument();
        });

        it("dispatches moveProject with the chosen folder", async () => {
            const spy = stubAction("moveProject");
            mockUseFolders({ items: [createFolder({ id: 1, name: "Payments" })] });

            renderWithProviders(
                <MoveToFolderDialog open project={createProject({ id: 5, folderId: null })} folder={undefined} />
            );
            await userEvent.click(screen.getByTestId("move-target-1"));
            await userEvent.click(screen.getByTestId("save-button"));

            expect(spy).toHaveBeenCalledWith({ projectId: 5, folderId: 1, currentFolderId: null });
        });

        it("disables the confirm button until a different target is chosen", async () => {
            mockUseFolders({ items: [createFolder({ id: 1, name: "Payments" })] });

            // Project already ungrouped, so the pre-selected target (root) is unchanged.
            renderWithProviders(
                <MoveToFolderDialog open project={createProject({ id: 5, folderId: null })} folder={undefined} />
            );
            expect(screen.getByTestId("save-button")).toBeDisabled();

            await userEvent.click(screen.getByTestId("move-target-1"));
            expect(screen.getByTestId("save-button")).not.toBeDisabled();
        });
    });

    describe("moving a folder", () => {
        it("disables the folder itself and its descendants as targets", () => {
            const parent = createFolder({ id: 1, name: "Parent", parentId: null });
            const child = createFolder({ id: 2, name: "Child", parentId: 1 });
            mockUseFolders({ items: [parent, child] });

            renderWithProviders(<MoveToFolderDialog open project={undefined} folder={parent} />);

            expect(screen.getByTestId("move-target-1")).toHaveAttribute("aria-disabled", "true");
            expect(screen.getByTestId("move-target-2")).toHaveAttribute("aria-disabled", "true");
        });

        it("disables a target that would push the moved folder past the maximum depth", () => {
            // A chain of MAX_FOLDER_DEPTH folders (depths 1..7) plus a separate leaf to move. Filing
            // the leaf under the deepest folder would reach depth 8, so that row is disabled while the
            // one level above it stays enabled.
            const chain = Array.from({ length: MAX_FOLDER_DEPTH }, (_, index) =>
                createFolder({ id: index + 1, name: `Level ${index + 1}`, parentId: index === 0 ? null : index })
            );
            const moving = createFolder({ id: 100, name: "Movable", parentId: null });
            mockUseFolders({ items: [...chain, moving] });

            renderWithProviders(<MoveToFolderDialog open project={undefined} folder={moving} />);

            expect(screen.getByTestId(`move-target-${MAX_FOLDER_DEPTH}`)).toHaveAttribute("aria-disabled", "true");
            expect(screen.getByTestId(`move-target-${MAX_FOLDER_DEPTH - 1}`)).not.toHaveAttribute(
                "aria-disabled",
                "true"
            );
        });

        it("dispatches updateFolder with the chosen parent", async () => {
            const spy = stubAction("updateFolder");
            const moving = createFolder({ id: 2, name: "Movable", parentId: null });
            mockUseFolders({ items: [createFolder({ id: 1, name: "Target" }), moving] });

            renderWithProviders(<MoveToFolderDialog open project={undefined} folder={moving} />);
            await userEvent.click(screen.getByTestId("move-target-1"));
            await userEvent.click(screen.getByTestId("save-button"));

            expect(spy).toHaveBeenCalledWith({ id: 2, parentId: 1 });
        });
    });
});
