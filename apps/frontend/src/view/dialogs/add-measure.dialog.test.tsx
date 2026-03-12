import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import AddMeasureDialog from "./add-measure.dialog";
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

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const project: Project = {
    id: 1,
    catalogId: 10,
    name: "Test Project",
    confidentialityLevel: CONFIDENTIALITY_LEVELS.INTERNAL,
    lineOfToleranceGreen: 4,
    lineOfToleranceRed: 9,
    createdAt: new Date(),
    updatedAt: new Date(),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const renderDialog = (props: { measure?: object } = {}) =>
    renderWithProviders(<AddMeasureDialog open={true} project={project} measure={undefined} {...props} />);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AddMeasureDialog", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render the add measure title", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByText(/Add Measure/i)).toBeInTheDocument();
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
        expect(mockCancelDialog).toHaveBeenCalledOnce();
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it("should pre-fill form fields when an existing measure is provided", () => {
        // Arrange & Act
        renderDialog({
            measure: { id: 5, name: "Existing Measure", description: "Some description" },
        });

        // Assert
        const nameTextarea = screen.getByTestId("measure-creation-modal_name-input").querySelector("textarea");
        expect(nameTextarea).toHaveValue("Existing Measure");
    });

    it("should call confirmDialog and navigate back when the form is submitted with valid data", async () => {
        // Arrange
        const user = userEvent.setup();
        renderDialog();

        // Act
        const nameTextarea = screen.getByTestId("measure-creation-modal_name-input").querySelector("textarea");
        if (!nameTextarea) throw new Error("Name textarea not found");
        await user.type(nameTextarea, "New Measure");
        // Use fireEvent.change for date inputs since userEvent.type doesn't work reliably with date inputs
        const dateInput = screen.getByTestId("measure-creation-modal_scheduled-at-input").querySelector("input");
        if (!dateInput) throw new Error("Date input not found");
        fireEvent.change(dateInput, { target: { value: "2026-12-31" } });
        await user.click(screen.getByText(/^Save$/i));

        // Assert
        await waitFor(() => {
            expect(mockConfirmDialog).toHaveBeenCalledOnce();
            expect(mockNavigate).toHaveBeenCalledWith(-1);
        });
    });

    it("should not submit the form when the scheduled date is missing", async () => {
        // Arrange
        const user = userEvent.setup();
        renderDialog();

        // Act
        const nameTextarea = screen.getByTestId("measure-creation-modal_name-input").querySelector("textarea");
        if (!nameTextarea) throw new Error("Name textarea not found");
        await user.type(nameTextarea, "New Measure");
        await user.click(screen.getByText(/^Save$/i));

        // Assert
        await waitFor(() => {
            expect(mockConfirmDialog).not.toHaveBeenCalled();
        });
    });
});
