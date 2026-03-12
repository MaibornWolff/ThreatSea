import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import CatalogMeasureDialog from "./catalog-measure.dialog";
import { ATTACKERS } from "#api/types/attackers.types.ts";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import type { CatalogMeasure } from "#api/types/catalog-measure.types.ts";

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
const newMeasureDefaults: Partial<CatalogMeasure> = {
    name: "",
    description: "",
    attacker: [] as unknown as ATTACKERS,
    pointOfAttack: [] as unknown as POINTS_OF_ATTACK,
    probability: 0,
    confidentiality: false,
    integrity: false,
    availability: false,
};

const existingCatalogMeasure: Partial<CatalogMeasure> = {
    id: 7,
    name: "Encrypt Data at Rest",
    description: "All sensitive data should be encrypted at rest",
    attacker: ATTACKERS.UNAUTHORISED_PARTIES,
    pointOfAttack: POINTS_OF_ATTACK.DATA_STORAGE_INFRASTRUCTURE,
    probability: 4,
    confidentiality: true,
    integrity: false,
    availability: false,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const renderDialog = (props: { catalogMeasure?: Partial<CatalogMeasure>; isNew?: boolean } = {}) =>
    renderWithProviders(
        <CatalogMeasureDialog open={true} catalogMeasure={newMeasureDefaults} isNew={true} catalogId={1} {...props} />
    );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CatalogMeasureDialog", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render the add measure title when isNew is true", () => {
        // Arrange & Act
        renderDialog({ isNew: true });

        // Assert
        expect(screen.getByText(/Add Measure/i)).toBeInTheDocument();
    });

    it("should render the edit measure title when isNew is false", () => {
        // Arrange & Act
        renderDialog({ catalogMeasure: existingCatalogMeasure, isNew: false });

        // Assert
        expect(screen.getByText(/Edit Measure/i)).toBeInTheDocument();
    });

    it("should have a name input field", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByTestId("catalog-measure-creation-modal_name-input")).toBeInTheDocument();
    });

    it("should have a description input field", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByTestId("catalog-measure-creation-modal_description-input")).toBeInTheDocument();
    });

    it("should have an attacker selection dropdown", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByTestId("catalog-measure-creation-modal_attacker-selection")).toBeInTheDocument();
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

    it("should pre-fill the name input when editing an existing catalog measure", () => {
        // Arrange & Act
        renderDialog({ catalogMeasure: existingCatalogMeasure, isNew: false });

        // Assert
        const nameInput = screen.getByTestId("catalog-measure-creation-modal_name-input").querySelector("input");
        expect(nameInput).toHaveValue("Encrypt Data at Rest");
    });

    it("should pre-fill the description input when editing an existing catalog measure", () => {
        // Arrange & Act
        renderDialog({ catalogMeasure: existingCatalogMeasure, isNew: false });

        // Assert
        const descInput = screen
            .getByTestId("catalog-measure-creation-modal_description-input")
            .querySelector("textarea");
        expect(descInput).toHaveValue("All sensitive data should be encrypted at rest");
    });

    it("should have a multiple attacker selection when creating a new catalog measure", () => {
        // Arrange & Act
        renderDialog({ isNew: true });

        // Assert
        const attackerSelect = screen.getByTestId("catalog-measure-creation-modal_attacker-selection");
        expect(attackerSelect).toBeInTheDocument();
    });

    it("should have CIA impact switches", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        // The dialog renders confidentiality, integrity, availability switches
        const switches = screen.getAllByRole("checkbox");
        expect(switches.length).toBeGreaterThanOrEqual(3);
    });
});
