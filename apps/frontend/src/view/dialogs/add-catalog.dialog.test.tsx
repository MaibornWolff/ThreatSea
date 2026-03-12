import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import AddCatalogDialog from "./add-catalog.dialog";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockCancelDialog = vi.fn();
const mockConfirmDialog = vi.fn();
const mockNavigate = vi.fn();

vi.mock("../../application/hooks/use-dialog.hook", () => ({
    useDialog: () => ({
        cancelDialog: mockCancelDialog,
        confirmDialog: mockConfirmDialog,
        values: null,
    }),
}));

vi.mock("react-router", async (importOriginal) => {
    const actual = await importOriginal<typeof import("react-router")>();
    return { ...actual, useNavigate: () => mockNavigate };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const renderDialog = (props: { catalog?: object } = {}) =>
    renderWithProviders(<AddCatalogDialog open={true} {...props} />);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AddCatalogDialog", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render the add catalog title when no catalog is provided", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByText(/Add Catalog/i)).toBeInTheDocument();
    });

    it("should render the edit catalog title when an existing catalog is provided", () => {
        // Arrange & Act
        renderDialog({ catalog: { id: 1, name: "Existing Catalog", language: "EN" } });

        // Assert
        expect(screen.getByText(/Edit Catalog/i)).toBeInTheDocument();
    });

    it("should have a name input field", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByTestId("catalog-creation-modal_name-input")).toBeInTheDocument();
    });

    it("should show language toggle buttons when creating a new catalog", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByText("EN")).toBeInTheDocument();
        expect(screen.getByText("DE")).toBeInTheDocument();
    });

    it("should not show language toggle buttons when editing an existing catalog", () => {
        // Arrange & Act
        renderDialog({ catalog: { id: 1, name: "Existing Catalog", language: "EN" } });

        // Assert
        expect(screen.queryByText("EN")).not.toBeInTheDocument();
        expect(screen.queryByText("DE")).not.toBeInTheDocument();
    });

    it("should show the empty catalog checkbox when creating a new catalog", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByTestId("catalog-creation-modal_empty-checkbox")).toBeInTheDocument();
    });

    it("should have a cancel button", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByTestId("cancel-button")).toBeInTheDocument();
    });

    it("should have a save button", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByTestId("save-button")).toBeInTheDocument();
    });

    it("should call cancelDialog and navigate back when cancel button is clicked", async () => {
        // Arrange
        const user = userEvent.setup();
        renderDialog();

        // Act
        await user.click(screen.getByTestId("cancel-button"));

        // Assert
        expect(mockCancelDialog).toHaveBeenCalledOnce();
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it("should toggle the empty catalog checkbox when clicked", async () => {
        // Arrange
        const user = userEvent.setup();
        renderDialog();
        const checkboxWrapper = screen.getByTestId("catalog-creation-modal_empty-checkbox");
        const checkboxInput = checkboxWrapper.querySelector("input") as HTMLInputElement;

        // Act
        await user.click(checkboxWrapper);

        // Assert
        expect(checkboxInput.checked).toBe(true);
    });

    it("should call confirmDialog and navigate back when the form is submitted with a name", async () => {
        // Arrange
        const user = userEvent.setup();
        renderDialog();

        // Act
        await user.type(screen.getByTestId("catalog-creation-modal_name-input").querySelector("input")!, "My Catalog");
        await user.click(screen.getByTestId("save-button"));

        // Assert
        await waitFor(() => {
            expect(mockConfirmDialog).toHaveBeenCalledOnce();
            expect(mockNavigate).toHaveBeenCalledWith(-1);
        });
    });

    it("should pre-fill the name field when editing an existing catalog", () => {
        // Arrange & Act
        renderDialog({ catalog: { id: 7, name: "Pre-filled Catalog", language: "DE" } });

        // Assert
        const nameInput = screen.getByTestId("catalog-creation-modal_name-input").querySelector("input");
        expect(nameInput).toHaveValue("Pre-filled Catalog");
    });
});
