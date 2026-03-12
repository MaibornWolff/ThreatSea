import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import MeasureImpactByMeasureDialog from "./measureImpactByMeasure.dialog";
import { ATTACKERS } from "#api/types/attackers.types.ts";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import { CONFIDENTIALITY_LEVELS } from "../../utils/confidentiality";
import type { Project } from "#api/types/project.types.ts";
import type { MeasureImpact } from "#api/types/measure-impact.types.ts";
import type { ThreatWithMetrics } from "#application/hooks/use-matrix.hook.ts";

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
    return { ...actual, useNavigate: () => mockNavigate };
});

// Mock useMeasureSuggestions to avoid Redux/API dependency
vi.mock("../../application/hooks/use-measureSuggestions", () => ({
    useMeasureSuggestions: () => ({
        suggestedMeasures: [],
        appliedMeasures: [],
        filteredCatalogMeasures: [],
        remainingMeasures: [],
    }),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const project: Project = {
    id: 1,
    catalogId: 10,
    name: "Test Project",
    confidentialityLevel: CONFIDENTIALITY_LEVELS.INTERNAL,
    lineOfToleranceGreen: 3,
    lineOfToleranceRed: 7,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-02"),
};

const threat: ThreatWithMetrics = {
    id: 42,
    pointOfAttackId: "poi-1",
    catalogThreatId: 10,
    name: "SQL Injection",
    description: "Attacker injects SQL code",
    pointOfAttack: POINTS_OF_ATTACK.USER_INTERFACE,
    attacker: ATTACKERS.UNAUTHORISED_PARTIES,
    probability: 3,
    confidentiality: true,
    integrity: false,
    availability: true,
    doneEditing: false,
    projectId: 1,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-02"),
    componentName: "Web Server",
    componentType: null,
    interfaceName: null,
    assets: [],
    risk: 9,
    damage: 3,
    measures: [],
    newProbability: 3,
    newDamage: 3,
    newRisk: 9,
    activeMeasures: 0,
    measuresDone: false,
};

const existingMeasureImpact: MeasureImpact = {
    id: 1,
    measureId: 5,
    threatId: 42,
    description: "Reduces probability by 50%",
    setsOutOfScope: false,
    impactsProbability: true,
    impactsDamage: false,
    probability: 2,
    damage: null,
    projectId: 1,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-02"),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const renderDialog = (props: { measureImpact?: MeasureImpact | null } = {}) =>
    renderWithProviders(
        <MeasureImpactByMeasureDialog open={true} project={project} threat={threat} measureImpact={null} {...props} />
    );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MeasureImpactByMeasureDialog", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render the dialog title with the threat name", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByText(/SQL Injection/i)).toBeInTheDocument();
    });

    it("should have a measure selection dropdown when creating a new measure impact", () => {
        // Arrange & Act
        renderDialog({ measureImpact: null });

        // Assert
        expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("should show the measure ID when editing an existing measure impact", () => {
        // Arrange & Act
        renderDialog({ measureImpact: existingMeasureImpact });

        // Assert
        expect(screen.getByText(/ID: 5/i)).toBeInTheDocument();
    });

    it("should have a description input field", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        const descInput = screen.getByRole("textbox");
        expect(descInput).toBeInTheDocument();
    });

    it("should have an out-of-scope checkbox", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        const checkboxes = screen.getAllByRole("checkbox");
        expect(checkboxes.length).toBeGreaterThanOrEqual(1);
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

    it("should pre-fill the description when editing an existing measure impact", () => {
        // Arrange & Act
        renderDialog({ measureImpact: existingMeasureImpact });

        // Assert
        const descInput = screen.getByRole("textbox");
        expect(descInput).toHaveValue("Reduces probability by 50%");
    });

    it("should disable the measure select when editing an existing measure impact", () => {
        // Arrange & Act
        renderDialog({ measureImpact: existingMeasureImpact });

        // Assert
        // When disableSelect is true, the select is disabled
        const select = screen.getByRole("combobox");
        expect(select).toHaveAttribute("aria-disabled", "true");
    });
});
