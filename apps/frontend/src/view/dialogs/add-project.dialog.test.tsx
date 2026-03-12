import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import AddProjectDialog from "./add-project.dialog";
import type { Project } from "#api/types/project.types.ts";
import { CONFIDENTIALITY_LEVELS } from "../../utils/confidentiality";

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

// Mock useCatalogs to avoid Redux/API dependency
vi.mock("../../application/hooks/use-catalogs.hook", () => ({
    useCatalogs: () => ({
        items: [
            { id: 1, name: "Default Catalog", language: "EN" },
            { id: 2, name: "German Catalog", language: "DE" },
        ],
        loadCatalogs: vi.fn(),
    }),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const existingProject: Partial<Project> = {
    id: 5,
    name: "Existing Project",
    description: "A project description",
    catalogId: 1,
    confidentialityLevel: CONFIDENTIALITY_LEVELS.INTERNAL,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const renderDialog = (props: { project?: Partial<Project> } = {}) =>
    renderWithProviders(<AddProjectDialog open={true} project={undefined} {...props} />);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AddProjectDialog", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render the add project title when no project is provided", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByText(/Add Project/i)).toBeInTheDocument();
    });

    it("should render the edit project title when an existing project is provided", () => {
        // Arrange & Act
        renderDialog({ project: existingProject });

        // Assert
        expect(screen.getByText(/Edit Project/i)).toBeInTheDocument();
    });

    it("should have a name input field", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByTestId("project-creation-modal_name-input")).toBeInTheDocument();
    });

    it("should have a description input field", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByTestId("project-creation-modal_description-input")).toBeInTheDocument();
    });

    it("should have a catalog selection dropdown", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByTestId("project-creation-modal_catalog-selection")).toBeInTheDocument();
    });

    it("should have a confidentiality level selection dropdown", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByTestId("project-creation-modal_confidentiality-selection")).toBeInTheDocument();
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

    it("should pre-fill the name field when editing an existing project", () => {
        // Arrange & Act
        renderDialog({ project: existingProject });

        // Assert
        const nameInput = screen.getByTestId("project-creation-modal_name-input").querySelector("input");
        expect(nameInput).toHaveValue("Existing Project");
    });

    it("should render available catalog options in the dropdown", async () => {
        // Arrange
        const user = userEvent.setup();
        renderDialog();

        // Act – open the catalog dropdown by clicking the combobox role element
        const catalogSelect = screen.getByTestId("project-creation-modal_catalog-selection");
        await user.click(catalogSelect.querySelector("[role='combobox']") ?? catalogSelect);

        // Assert – options are now visible in the portal
        expect(screen.getByText("Default Catalog")).toBeInTheDocument();
        expect(screen.getByText("German Catalog")).toBeInTheDocument();
    });

    it("should not submit the form when no catalog is selected", async () => {
        // Arrange
        const user = userEvent.setup();
        renderDialog();

        // Act
        await user.type(screen.getByTestId("project-creation-modal_name-input").querySelector("input")!, "New Project");
        await user.click(screen.getByTestId("save-button"));

        // Assert
        await waitFor(() => {
            expect(mockConfirmDialog).not.toHaveBeenCalled();
        });
    });
});
