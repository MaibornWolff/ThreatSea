import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditorSidebarSelectedConnection } from "./editor-sidebar-selected-connection.component";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { createConnection } from "#test-utils/builders.ts";
import { USER_ROLES } from "#api/types/user-roles.types.ts";

describe("EditorSidebarSelectedConnection", () => {
    describe("Reset routing button", () => {
        it("renders the reset routing button when the connection is pinned and the user is an editor", () => {
            renderWithProviders(
                <EditorSidebarSelectedConnection
                    selectedConnection={createConnection({ pinned: true })}
                    handleDeleteConnection={vi.fn()}
                    handleOnConnectionNameChange={vi.fn()}
                    handleResetConnectionRouting={vi.fn()}
                    userRole={USER_ROLES.EDITOR}
                />
            );

            expect(screen.getByRole("button", { name: "Reset routing" })).toBeInTheDocument();
        });

        it("does not render the reset routing button when the connection is not pinned", () => {
            renderWithProviders(
                <EditorSidebarSelectedConnection
                    selectedConnection={createConnection({ pinned: false })}
                    handleDeleteConnection={vi.fn()}
                    handleOnConnectionNameChange={vi.fn()}
                    handleResetConnectionRouting={vi.fn()}
                    userRole={USER_ROLES.EDITOR}
                />
            );

            expect(screen.queryByRole("button", { name: "Reset routing" })).not.toBeInTheDocument();
        });

        it("does not render the reset routing button when pinned is undefined", () => {
            const connection = createConnection({ pinned: false });
            const { pinned: _pinned, ...connectionWithoutPinned } = connection;

            renderWithProviders(
                <EditorSidebarSelectedConnection
                    selectedConnection={connectionWithoutPinned as typeof connection}
                    handleDeleteConnection={vi.fn()}
                    handleOnConnectionNameChange={vi.fn()}
                    handleResetConnectionRouting={vi.fn()}
                    userRole={USER_ROLES.EDITOR}
                />
            );

            expect(screen.queryByRole("button", { name: "Reset routing" })).not.toBeInTheDocument();
        });

        it("does not render the reset routing button for viewers even when the connection is pinned", () => {
            renderWithProviders(
                <EditorSidebarSelectedConnection
                    selectedConnection={createConnection({ pinned: true })}
                    handleDeleteConnection={vi.fn()}
                    handleOnConnectionNameChange={vi.fn()}
                    handleResetConnectionRouting={vi.fn()}
                    userRole={USER_ROLES.VIEWER}
                />
            );

            expect(screen.queryByRole("button", { name: "Reset routing" })).not.toBeInTheDocument();
        });

        it("calls handleResetConnectionRouting when the reset routing button is clicked", async () => {
            const user = userEvent.setup();
            const handleResetConnectionRouting = vi.fn();

            renderWithProviders(
                <EditorSidebarSelectedConnection
                    selectedConnection={createConnection({ pinned: true })}
                    handleDeleteConnection={vi.fn()}
                    handleOnConnectionNameChange={vi.fn()}
                    handleResetConnectionRouting={handleResetConnectionRouting}
                    userRole={USER_ROLES.EDITOR}
                />
            );

            await user.click(screen.getByRole("button", { name: "Reset routing" }));

            expect(handleResetConnectionRouting).toHaveBeenCalledTimes(1);
        });
    });
});
