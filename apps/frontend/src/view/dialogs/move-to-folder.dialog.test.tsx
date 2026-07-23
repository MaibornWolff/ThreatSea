import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FoldersActions } from "#application/actions/folders.actions.ts";
import { createFolder, createProject } from "#test-utils/builders.ts";
import { mockUseFolders } from "#test-utils/mock-hooks.ts";

const navigate = vi.fn();
vi.mock("react-router", () => ({ useNavigate: () => navigate }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const dispatch = vi.fn();
vi.mock("#application/hooks/use-app-redux.hook.ts", () => ({ useAppDispatch: () => dispatch }));

// Stub the app Dialog/Button wrappers (they read the app theme) so the picker can render plainly.
vi.mock("#view/components/dialog.component.tsx", () => ({
    Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("#view/components/button.component.tsx", () => ({
    Button: ({
        children,
        onClick,
        disabled,
        ["data-testid"]: testId,
    }: {
        children: React.ReactNode;
        onClick?: () => void;
        disabled?: boolean;
        ["data-testid"]?: string;
    }) => (
        <button onClick={onClick} disabled={disabled} data-testid={testId}>
            {children}
        </button>
    ),
}));

import MoveToFolderDialog from "./move-to-folder.dialog";

describe("MoveToFolderDialog", () => {
    describe("moving a project", () => {
        it("lists an ungrouped target plus every folder", () => {
            mockUseFolders({
                items: [createFolder({ id: 1, name: "Payments" }), createFolder({ id: 2, name: "Internal" })],
            });

            render(<MoveToFolderDialog open project={createProject({ id: 5, folderId: null })} folder={undefined} />);

            expect(screen.getByTestId("move-target-root")).toBeInTheDocument();
            expect(screen.getByTestId("move-target-1")).toBeInTheDocument();
            expect(screen.getByTestId("move-target-2")).toBeInTheDocument();
        });

        it("dispatches moveProject with the chosen folder", async () => {
            const spy = vi.spyOn(FoldersActions, "moveProject");
            mockUseFolders({ items: [createFolder({ id: 1, name: "Payments" })] });

            render(<MoveToFolderDialog open project={createProject({ id: 5, folderId: null })} folder={undefined} />);
            await userEvent.click(screen.getByTestId("move-target-1"));
            await userEvent.click(screen.getByTestId("save-button"));

            expect(spy).toHaveBeenCalledWith({ projectId: 5, folderId: 1 });
            spy.mockRestore();
        });

        it("disables the confirm button until a different target is chosen", async () => {
            mockUseFolders({ items: [createFolder({ id: 1, name: "Payments" })] });

            // Project already ungrouped, so the pre-selected target (root) is unchanged.
            render(<MoveToFolderDialog open project={createProject({ id: 5, folderId: null })} folder={undefined} />);
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

            render(<MoveToFolderDialog open project={undefined} folder={parent} />);

            expect(screen.getByTestId("move-target-1")).toHaveClass("Mui-disabled");
            expect(screen.getByTestId("move-target-2")).toHaveClass("Mui-disabled");
        });

        it("dispatches updateFolder with the chosen parent", async () => {
            const spy = vi.spyOn(FoldersActions, "updateFolder");
            const moving = createFolder({ id: 2, name: "Movable", parentId: null });
            mockUseFolders({ items: [createFolder({ id: 1, name: "Target" }), moving] });

            render(<MoveToFolderDialog open project={undefined} folder={moving} />);
            await userEvent.click(screen.getByTestId("move-target-1"));
            await userEvent.click(screen.getByTestId("save-button"));

            expect(spy).toHaveBeenCalledWith({ id: 2, parentId: 1 });
            spy.mockRestore();
        });
    });
});
