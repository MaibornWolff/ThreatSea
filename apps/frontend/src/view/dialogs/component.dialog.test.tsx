import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import ComponentDialog from "./component.dialog";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import type { ComponentType } from "#api/types/component-types.types.ts";

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

vi.mock("react-router-dom", async (importOriginal) => {
    const actual = await importOriginal<typeof import("react-router-dom")>();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({ projectId: "1" }),
    };
});

vi.mock("../../application/hooks/use-confirm.hook", () => ({
    useConfirm: () => ({
        openConfirm: vi.fn(),
    }),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const existingComponent: ComponentType = {
    id: 5,
    name: "Web Application",
    symbol: null,
    pointsOfAttack: [POINTS_OF_ATTACK.USER_INTERFACE, POINTS_OF_ATTACK.DATA_STORAGE_INFRASTRUCTURE],
    projectId: 1,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-02"),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const renderDialog = (props: { component?: ComponentType } = {}) =>
    renderWithProviders(<ComponentDialog open={true} component={undefined} {...props} />);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ComponentDialog", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render the add component title when no component is provided", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByText(/Add Component/i)).toBeInTheDocument();
    });

    it("should render the edit component title when an existing component is provided", () => {
        // Arrange & Act
        renderDialog({ component: existingComponent });

        // Assert
        expect(screen.getByText(/Edit Component/i)).toBeInTheDocument();
    });

    it("should have a name input field", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        const nameInput = screen.getByRole("textbox");
        expect(nameInput).toBeInTheDocument();
    });

    it("should pre-fill the name input when editing an existing component", () => {
        // Arrange & Act
        renderDialog({ component: existingComponent });

        // Assert
        const nameInput = screen.getByRole("textbox");
        expect(nameInput).toHaveValue("Web Application");
    });

    it("should have points of attack toggle switches", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        // COMPONENT_POINTS_OF_ATTACK filters out COMMUNICATION_INFRASTRUCTURE and COMMUNICATION_INTERFACES
        // leaving 4 points of attack
        const switches = screen.getAllByRole("checkbox");
        expect(switches.length).toBeGreaterThanOrEqual(4);
    });

    it("should have a cancel button", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByText(/^Cancel$/i)).toBeInTheDocument();
    });

    it("should have a save button", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByText(/^Save$/i)).toBeInTheDocument();
    });

    it("should call cancelDialog and navigate back when cancel button is clicked", async () => {
        // Arrange
        const user = userEvent.setup();
        renderDialog();

        // Act
        await user.click(screen.getByText(/^Cancel$/i));

        // Assert
        expect(mockCancelDialog).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it("should show an error when save is clicked without selecting any point of attack", async () => {
        // Arrange
        const user = userEvent.setup();
        renderDialog();

        // Fill in the name to pass name validation
        await user.type(screen.getByRole("textbox"), "My Component");

        // Act - click save without selecting any point of attack
        await user.click(screen.getByText(/^Save$/i));

        // Assert - error message should appear
        expect(screen.getByText(/At least one point of attack must be selected/i)).toBeInTheDocument();
    });

    it("should not call confirmDialog when no point of attack is selected", async () => {
        // Arrange
        const user = userEvent.setup();
        renderDialog();

        await user.type(screen.getByRole("textbox"), "My Component");

        // Act
        await user.click(screen.getByText(/^Save$/i));

        // Assert
        expect(mockConfirmDialog).not.toHaveBeenCalled();
    });

    it("should call confirmDialog when a point of attack is selected and name is provided", async () => {
        // Arrange
        const user = userEvent.setup();
        renderDialog();

        // Fill in name
        await user.type(screen.getByRole("textbox"), "My Component");

        // Toggle the first point of attack switch
        const switches = screen.getAllByRole("checkbox");
        const firstSwitch = switches[0];
        if (!firstSwitch) throw new Error("No switch found");
        await user.click(firstSwitch);

        // Act
        await user.click(screen.getByText(/^Save$/i));

        // Assert
        expect(mockConfirmDialog).toHaveBeenCalledTimes(1);
    });
});
