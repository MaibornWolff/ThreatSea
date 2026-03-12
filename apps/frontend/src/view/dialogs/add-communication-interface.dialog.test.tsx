import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import CommunicationInterfaceDialog from "./add-communication-interface.dialog";
import type { SystemCommunicationInterface } from "#api/types/system.types.ts";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockCancelDialog = vi.fn();
const mockHandleCreateNew = vi.fn();
const mockOnClose = vi.fn();

vi.mock("../../application/hooks/use-dialog.hook", () => ({
    useDialog: () => ({
        cancelDialog: mockCancelDialog,
        confirmDialog: vi.fn(),
        values: null,
    }),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const existingInterface: SystemCommunicationInterface = {
    id: "ci-1",
    name: "My Interface",
    icon: "desktop",
    type: "custom",
    projectId: 1,
    componentId: "comp-1",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const renderDialog = (props: { communicationInterface?: SystemCommunicationInterface } = {}) =>
    renderWithProviders(
        <CommunicationInterfaceDialog
            open={true}
            onClose={mockOnClose}
            handleCreateNew={mockHandleCreateNew}
            {...props}
        />
    );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CommunicationInterfaceDialog", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render the create new interface title when no interface is provided", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByText(/Create New Communication Interface/i)).toBeInTheDocument();
    });

    it("should render the edit interface title when an existing interface is provided", () => {
        // Arrange & Act
        renderDialog({ communicationInterface: existingInterface });

        // Assert
        expect(screen.getByText(/Edit Communication Interface/i)).toBeInTheDocument();
    });

    it("should have a name input field", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByTestId("communication-name")).toBeInTheDocument();
    });

    it("should have an icon selector", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByTestId("communication-icon")).toBeInTheDocument();
    });

    it("should have a save button", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByTestId("save-communication")).toBeInTheDocument();
    });

    it("should call cancelDialog and onClose when cancel button is clicked", async () => {
        // Arrange
        const user = userEvent.setup();
        renderDialog();

        // Act
        await user.click(screen.getByText(/^Cancel$/i));

        // Assert
        expect(mockCancelDialog).toHaveBeenCalledOnce();
        expect(mockOnClose).toHaveBeenCalledOnce();
    });

    it("should pre-fill the name field when editing an existing interface", () => {
        // Arrange & Act
        renderDialog({ communicationInterface: existingInterface });

        // Assert
        const nameInput = screen.getByTestId("communication-name").querySelector("input");
        expect(nameInput).toHaveValue("My Interface");
    });

    it("should not call handleCreateNew when submitting without selecting an icon", async () => {
        // Arrange
        const user = userEvent.setup();
        renderDialog();

        // Act – type a name but leave icon empty (icon is required)
        await user.type(screen.getByTestId("communication-name"), "New Interface");
        await user.click(screen.getByTestId("save-communication"));

        // Assert – icon validation prevents submission
        await waitFor(() => {
            expect(mockHandleCreateNew).not.toHaveBeenCalled();
        });
    });
});
