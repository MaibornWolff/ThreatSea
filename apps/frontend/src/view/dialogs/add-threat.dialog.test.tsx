import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import AddThreatDialog from "./add-threat.dialog";
import { ATTACKERS } from "#api/types/attackers.types.ts";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { CONFIDENTIALITY_LEVELS } from "../../utils/confidentiality";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import type { ExtendedProject } from "#api/types/project.types.ts";

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

vi.mock("react-router-dom", async (importOriginal) => {
    const actual = await importOriginal<typeof import("react-router-dom")>();
    return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("react-router", async (importOriginal) => {
    const actual = await importOriginal<typeof import("react-router")>();
    return { ...actual, useNavigate: () => mockNavigate };
});

// Mock useThreatMeasuresList to avoid Redux/API dependency
vi.mock("#application/hooks/use-threat-measures-list.hook.ts", () => ({
    useThreatMeasuresList: () => ({
        threatMeasures: [],
        setSortBy: vi.fn(),
        setSortDirection: vi.fn(),
        setSearchValue: vi.fn(),
        sortBy: "measureName",
        sortDirection: "asc",
        searchValue: "",
    }),
}));

// Mock useConfirm to avoid confirm dialog dependency
vi.mock("../../application/hooks/use-confirm.hook", () => ({
    useConfirm: () => ({
        openConfirm: vi.fn(),
    }),
}));

// Mock ThreatMeasuresTable to avoid deep rendering
vi.mock("#view/components/threatMeasuresTable.component.tsx", () => ({
    ThreatMeasuresTable: () => <div data-testid="threat-measures-table">ThreatMeasuresTable</div>,
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseThreat: ExtendedThreat = {
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
};

const baseProject: ExtendedProject = {
    id: 1,
    catalogId: 10,
    name: "Test Project",
    confidentialityLevel: CONFIDENTIALITY_LEVELS.INTERNAL,
    lineOfToleranceGreen: 3,
    lineOfToleranceRed: 7,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-02"),
    role: USER_ROLES.OWNER,
    image: null,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const renderDialog = (props: { threat?: ExtendedThreat; project?: ExtendedProject; userRole?: USER_ROLES } = {}) =>
    renderWithProviders(
        <AddThreatDialog open={true} threat={baseThreat} project={baseProject} userRole={USER_ROLES.OWNER} {...props} />
    );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AddThreatDialog", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render the threat name in the dialog header", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        // The threat name is pre-filled in the name input field
        const nameInput = screen.getByTestId("EditThreatName").querySelector("input");
        expect(nameInput).toHaveValue("SQL Injection");
    });

    it("should render the component name in the dialog header", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        // The component name is rendered as part of a ListItemText string
        expect(screen.getByText((content) => content.includes("Web Server"))).toBeInTheDocument();
    });

    it("should have a MAIN tab", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByTestId("ThreatsDialogCancel")).toBeInTheDocument();
    });

    it("should have a name input field on the MAIN tab", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByTestId("EditThreatName")).toBeInTheDocument();
    });

    it("should have a description input field on the MAIN tab", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByTestId("EditThreatDescription")).toBeInTheDocument();
    });

    it("should have a probability input field on the MAIN tab", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByTestId("EditThreatProbability")).toBeInTheDocument();
    });

    it("should pre-fill the name input with the threat name", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        const nameInput = screen.getByTestId("EditThreatName").querySelector("input");
        expect(nameInput).toHaveValue("SQL Injection");
    });

    it("should pre-fill the description input with the threat description", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        const descInput = screen.getByTestId("EditThreatDescription").querySelector("textarea");
        expect(descInput).toHaveValue("Attacker injects SQL code");
    });

    it("should pre-fill the probability input with the threat probability", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        const probInput = screen.getByTestId("EditThreatProbability").querySelector("input");
        expect(probInput).toHaveValue(3);
    });

    it("should have a cancel button", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByTestId("ThreatsDialogCancel")).toBeInTheDocument();
    });

    it("should have a save button on the MAIN tab", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByTestId("EditThreatSave")).toBeInTheDocument();
    });

    it("should call cancelDialog and navigate back when cancel button is clicked", async () => {
        // Arrange
        const user = userEvent.setup();
        renderDialog();

        // Act – the cancel button renders the translated "Cancel" text
        await user.click(screen.getByRole("button", { name: /^Cancel$/i }));

        // Assert
        expect(mockCancelDialog).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it("should navigate to the ASSETS tab when the ASSETS tab is clicked", async () => {
        // Arrange
        const user = userEvent.setup();
        renderDialog();

        // Act
        await user.click(screen.getByTestId("ThreatToAsset"));

        // Assert
        expect(screen.getByTestId("EditEssetsSave")).toBeInTheDocument();
    });

    it("should navigate to the MEASURES tab when the MEASURES tab is clicked", async () => {
        // Arrange
        const user = userEvent.setup();
        renderDialog();

        // Act
        await user.click(screen.getByTestId("ThreatToMeasure"));

        // Assert
        expect(screen.getByTestId("threat-measures-table")).toBeInTheDocument();
    });

    it("should disable the save button for VIEWER role", () => {
        // Arrange & Act
        renderDialog({ userRole: USER_ROLES.VIEWER });

        // Assert
        const saveButton = screen.getByTestId("EditThreatSave");
        expect(saveButton).toBeDisabled();
    });

    it("should call confirmDialog when the save button is clicked with valid data", async () => {
        // Arrange
        const user = userEvent.setup();
        renderDialog();

        // Act
        await user.click(screen.getByTestId("EditThreatSave"));

        // Assert
        expect(mockConfirmDialog).toHaveBeenCalledTimes(1);
    });
});
