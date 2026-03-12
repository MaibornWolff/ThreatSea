import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import CatalogThreatDialog from "./catalog-threat.dialog";
import { ATTACKERS } from "#api/types/attackers.types.ts";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import type { CatalogThreat } from "#api/types/catalog-threat.types.ts";

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
// Fixtures
// ---------------------------------------------------------------------------

/**
 * When isNew=true the attacker/pointOfAttack Selects use multiple={true},
 * which requires array values. Provide arrays so MUI does not throw.
 */
const newThreatDefaults: Partial<CatalogThreat> = {
    name: "",
    description: "",
    attacker: [] as unknown as ATTACKERS,
    pointOfAttack: [] as unknown as POINTS_OF_ATTACK,
    probability: 0,
    confidentiality: false,
    integrity: false,
    availability: false,
};

const existingCatalogThreat: Partial<CatalogThreat> = {
    id: 3,
    name: "Brute Force Attack",
    description: "Attacker tries all possible passwords",
    attacker: ATTACKERS.UNAUTHORISED_PARTIES,
    pointOfAttack: POINTS_OF_ATTACK.USER_INTERFACE,
    probability: 5,
    confidentiality: true,
    integrity: true,
    availability: false,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const renderDialog = (props: { catalogThreat?: Partial<CatalogThreat>; isNew?: boolean } = {}) =>
    renderWithProviders(<CatalogThreatDialog open={true} catalogThreat={newThreatDefaults} isNew={true} {...props} />);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CatalogThreatDialog", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render the add threat title when isNew is true", () => {
        // Arrange & Act
        renderDialog({ isNew: true });

        // Assert
        expect(screen.getByText(/Add Threat/i)).toBeInTheDocument();
    });

    it("should render the edit threat title when isNew is false", () => {
        // Arrange & Act
        renderDialog({ catalogThreat: existingCatalogThreat, isNew: false });

        // Assert
        expect(screen.getByText(/Edit Threat/i)).toBeInTheDocument();
    });

    it("should have a name input field", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByTestId("catalog-threat-creation-modal_name-input")).toBeInTheDocument();
    });

    it("should have a description input field", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByTestId("catalog-threat-creation-modal_description-input")).toBeInTheDocument();
    });

    it("should have an attacker selection dropdown", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByTestId("catalog-threat-creation-modal_attacker-selection")).toBeInTheDocument();
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
        expect(mockCancelDialog).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it("should pre-fill the name input when editing an existing catalog threat", () => {
        // Arrange & Act
        renderDialog({ catalogThreat: existingCatalogThreat, isNew: false });

        // Assert
        const nameInput = screen.getByTestId("catalog-threat-creation-modal_name-input").querySelector("input");
        expect(nameInput).toHaveValue("Brute Force Attack");
    });

    it("should pre-fill the description input when editing an existing catalog threat", () => {
        // Arrange & Act
        renderDialog({ catalogThreat: existingCatalogThreat, isNew: false });

        // Assert
        const descInput = screen
            .getByTestId("catalog-threat-creation-modal_description-input")
            .querySelector("textarea");
        expect(descInput).toHaveValue("Attacker tries all possible passwords");
    });

    it("should have CIA impact switches", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        const switches = screen.getAllByRole("checkbox");
        expect(switches.length).toBeGreaterThanOrEqual(3);
    });

    it("should not call confirmDialog when save is clicked without selecting an attacker", async () => {
        // Arrange
        const user = userEvent.setup();
        renderDialog({ isNew: true });

        // Act
        await user.click(screen.getByTestId("save-button"));

        // Assert
        expect(mockConfirmDialog).not.toHaveBeenCalled();
    });
});
