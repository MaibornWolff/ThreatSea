import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import MeasureImpactByThreatDialog from "./measureImpactByThreat.dialog";
import { CONFIDENTIALITY_LEVELS } from "../../utils/confidentiality";
import type { Project } from "#api/types/project.types.ts";
import type { Measure } from "#api/types/measure.types.ts";
import type { MeasureImpact } from "#api/types/measure-impact.types.ts";

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

// Mock useThreatSuggestions to avoid Redux/API dependency
vi.mock("../../application/hooks/use-ThreatSuggestions", () => ({
    useThreatSuggestions: () => ({
        suggestedThreats: [],
        remainingThreats: [],
        impactedThreats: [],
    }),
}));

// Mock useMeasureImpactPlaceholder to avoid Redux/API dependency
vi.mock("../../application/hooks/use-measureImpacts-placeHolder.hook", () => ({
    useMeasureImpactPlaceholder: () => ({
        setCurrentThreatId: vi.fn(),
        damagePlaceholder: null,
        probabilityPlaceholder: null,
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

const measure: Measure = {
    id: 5,
    name: "Implement TLS",
    description: "Enable TLS 1.3 on all endpoints",
    scheduledAt: new Date("2024-06-01"),
    projectId: 1,
    catalogMeasureId: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-02"),
};

const existingMeasureImpact: MeasureImpact = {
    id: 2,
    measureId: 5,
    threatId: 42,
    description: "Reduces attack surface",
    setsOutOfScope: false,
    impactsProbability: false,
    impactsDamage: true,
    probability: null,
    damage: 2,
    projectId: 1,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-02"),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const renderDialog = (props: { measureImpact?: MeasureImpact | null } = {}) =>
    renderWithProviders(
        <MeasureImpactByThreatDialog open={true} project={project} measure={measure} measureImpact={null} {...props} />
    );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MeasureImpactByThreatDialog", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render the dialog title with the measure name", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByText(/Implement TLS/i)).toBeInTheDocument();
    });

    it("should have a threat selection dropdown when creating a new measure impact", () => {
        // Arrange & Act
        renderDialog({ measureImpact: null });

        // Assert
        expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("should disable the threat select when editing an existing measure impact", () => {
        // Arrange & Act
        renderDialog({ measureImpact: existingMeasureImpact });

        // Assert – MUI Select uses aria-disabled when disabled
        const select = screen.getByRole("combobox");
        expect(select).toHaveAttribute("aria-disabled", "true");
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
        expect(descInput).toHaveValue("Reduces attack surface");
    });
});
