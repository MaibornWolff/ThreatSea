import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import MeasureDetailsDialog from "./measure-details.dialog";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { CONFIDENTIALITY_LEVELS } from "../../utils/confidentiality";
import type { Project } from "#api/types/project.types.ts";
import type { Measure } from "#api/types/measure.types.ts";

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

vi.mock("../../application/hooks/use-confirm.hook", () => ({
    useConfirm: () => ({
        openConfirm: vi.fn(),
    }),
}));

// Mock useMeasureThreatsList to avoid Redux/API dependency
vi.mock("../../application/hooks/use-measure-threats-list.hook", () => ({
    useMeasureThreatsList: () => ({
        measureThreats: [],
        setSortBy: vi.fn(),
        setSortDirection: vi.fn(),
        setSearchValue: vi.fn(),
        deleteMeasureImpact: vi.fn(),
        sortBy: "threatName",
        sortDirection: "asc",
        searchValue: "",
    }),
}));

// Mock MeasureThreatsTable to avoid deep rendering
vi.mock("../components/measureThreatsTable.component", () => ({
    MeasureThreatsTable: () => <div data-testid="measure-threats-table">MeasureThreatsTable</div>,
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const renderDialog = (props: { measure?: Measure; storeRole?: USER_ROLES } = {}) => {
    const { storeRole = USER_ROLES.OWNER, measure: measureProp = measure } = props;
    return renderWithProviders(<MeasureDetailsDialog open={true} project={project} measure={measureProp} />, {
        preloadedState: {
            projects: {
                current: { ...project, role: storeRole, image: null },
                ids: [],
                entities: {},
                isPending: false,
            },
        },
    });
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MeasureDetailsDialog", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render the edit measure title when a measure with an id is provided", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByText(/Edit Measure/i)).toBeInTheDocument();
    });

    it("should have a name input field", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByTestId("measure-creation-modal_name-input")).toBeInTheDocument();
    });

    it("should have a description input field", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByTestId("measure-creation-modal_description-input")).toBeInTheDocument();
    });

    it("should have a scheduled date input field", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByTestId("measure-creation-modal_scheduled-at-input")).toBeInTheDocument();
    });

    it("should pre-fill the name input with the measure name", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        const nameInput = screen.getByTestId("measure-creation-modal_name-input").querySelector("textarea");
        expect(nameInput).toHaveValue("Implement TLS");
    });

    it("should pre-fill the description input with the measure description", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        const descInput = screen.getByTestId("measure-creation-modal_description-input").querySelector("textarea");
        expect(descInput).toHaveValue("Enable TLS 1.3 on all endpoints");
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

    it("should disable the save button for VIEWER role", () => {
        // Arrange & Act
        renderDialog({ storeRole: USER_ROLES.VIEWER });

        // Assert
        expect(screen.getByTestId("save-button")).toBeDisabled();
    });

    it("should enable the save button for EDITOR role", () => {
        // Arrange & Act
        renderDialog({ storeRole: USER_ROLES.EDITOR });

        // Assert
        expect(screen.getByTestId("save-button")).not.toBeDisabled();
    });

    it("should have a THREATS tab that is enabled for existing measures", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByTestId("ThreatToAsset")).toBeInTheDocument();
        expect(screen.getByTestId("ThreatToAsset")).not.toHaveAttribute("aria-disabled", "true");
    });

    it("should call confirmDialog when save is clicked with valid data", async () => {
        // Arrange
        const user = userEvent.setup();
        renderDialog();

        // Act
        await user.click(screen.getByTestId("save-button"));

        // Assert
        expect(mockConfirmDialog).toHaveBeenCalledTimes(1);
    });
});
