import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import AddAssetDialog from "./add-asset.dialog";
import { USER_ROLES } from "../../api/types/user-roles.types";

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

const defaultProps = {
    open: true,
    projectId: 1,
    userRole: USER_ROLES.OWNER,
};

const renderDialog = (props: Partial<typeof defaultProps & { asset: object }> = {}) =>
    renderWithProviders(<AddAssetDialog {...defaultProps} {...props} />);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AddAssetDialog", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render the add asset title when no asset is provided", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByText(/Add Asset/i)).toBeInTheDocument();
    });

    it("should render the edit asset title when an existing asset is provided", () => {
        // Arrange & Act
        renderDialog({ asset: { id: 42, name: "My Asset" } } as never);

        // Assert
        expect(screen.getByText(/Edit Asset/i)).toBeInTheDocument();
    });

    it("should display the asset ID when editing an existing asset", () => {
        // Arrange & Act
        renderDialog({ asset: { id: 42, name: "My Asset" } } as never);

        // Assert
        expect(screen.getByText(/42/)).toBeInTheDocument();
    });

    it("should have a name input field", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByTestId("asset-creation-modal_name-input")).toBeInTheDocument();
    });

    it("should have confidentiality, integrity and availability number inputs", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByTestId("asset-creation-modal_confidentiality-input")).toBeInTheDocument();
        expect(screen.getByTestId("asset-creation-modal_integrity-input")).toBeInTheDocument();
        expect(screen.getByTestId("asset-creation-modal_availability-input")).toBeInTheDocument();
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

    it("should disable the save button when the user role is VIEWER", () => {
        // Arrange & Act
        renderDialog({ userRole: USER_ROLES.VIEWER });

        // Assert
        expect(screen.getByTestId("save-button")).toBeDisabled();
    });

    it("should enable the save button when the user role is EDITOR", () => {
        // Arrange & Act
        renderDialog({ userRole: USER_ROLES.EDITOR });

        // Assert
        expect(screen.getByTestId("save-button")).not.toBeDisabled();
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

    it("should toggle the confidentiality justification section when its expand button is clicked", async () => {
        // Arrange
        const user = userEvent.setup();
        renderDialog();

        // Act
        await user.click(screen.getByTestId("asset-creation-modal_confidentiality-justification-button"));

        // Assert
        expect(screen.getByTestId("asset-creation-modal_confidentiality-justification-input")).toBeInTheDocument();
    });

    it("should toggle the integrity justification section when its expand button is clicked", async () => {
        // Arrange
        const user = userEvent.setup();
        renderDialog();

        // Act
        await user.click(screen.getByTestId("asset-creation-modal_integrity-justification-button"));

        // Assert
        expect(screen.getByTestId("asset-creation-modal_integrity-justification-input")).toBeInTheDocument();
    });

    it("should toggle the availability justification section when its expand button is clicked", async () => {
        // Arrange
        const user = userEvent.setup();
        renderDialog();

        // Act
        await user.click(screen.getByTestId("asset-creation-modal_availability-justification-button"));

        // Assert
        expect(screen.getByTestId("asset-creation-modal_availability-justification-input")).toBeInTheDocument();
    });

    it("should call confirmDialog and navigate back when the form is submitted with valid data", async () => {
        // Arrange
        const user = userEvent.setup();
        renderDialog();

        // Act
        await user.type(screen.getByTestId("asset-creation-modal_name-input").querySelector("input")!, "New Asset");
        const confInput = screen.getByTestId("asset-creation-modal_confidentiality-input").querySelector("input")!;
        await user.clear(confInput);
        await user.type(confInput, "3");
        const intInput = screen.getByTestId("asset-creation-modal_integrity-input").querySelector("input")!;
        await user.clear(intInput);
        await user.type(intInput, "2");
        const availInput = screen.getByTestId("asset-creation-modal_availability-input").querySelector("input")!;
        await user.clear(availInput);
        await user.type(availInput, "4");
        await user.click(screen.getByTestId("save-button"));

        // Assert
        await waitFor(() => {
            expect(mockConfirmDialog).toHaveBeenCalledOnce();
            expect(mockNavigate).toHaveBeenCalledWith(-1);
        });
    });

    it("should pre-fill form fields with existing asset data", () => {
        // Arrange & Act
        renderDialog({
            asset: {
                id: 5,
                name: "Existing Asset",
                confidentiality: 3,
                integrity: 2,
                availability: 4,
            },
        } as never);

        // Assert
        const nameInput = screen.getByTestId("asset-creation-modal_name-input").querySelector("input");
        expect(nameInput).toHaveValue("Existing Asset");
    });
});
