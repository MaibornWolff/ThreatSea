import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import AddMemberDialog from "./add-member.dialog";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import type { Member } from "#api/types/members.types.ts";
import type { UserState } from "#application/reducers/user.reducer.ts";

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

// Mock AddableMember since it makes API calls
vi.mock("../components/addableMember.component", () => ({
    AddableMember: () => <div data-testid="addable-member-mock" />,
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const existingMember: Member = {
    id: 42,
    name: "Jane Doe",
    email: "jane@example.com",
    role: USER_ROLES.EDITOR,
};

const currentUser: UserState = {
    userId: 1,
    firstname: "Me",
    lastname: "User",
    displayName: "Me User",
    email: "me@example.com",
    status: { isLoggedIn: true },
    isPending: false,
};

const defaultProps = {
    open: true,
    memberPath: "projects",
    projectCatalogId: 1,
    member: null as Member | null | undefined,
    isNotAloneOwner: null as boolean | null | undefined,
    user: currentUser as UserState | null | undefined,
    userCatalogRole: USER_ROLES.OWNER,
    userProjectRole: USER_ROLES.OWNER,
    isProject: true,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const renderDialog = (props: Partial<typeof defaultProps> = {}) =>
    renderWithProviders(<AddMemberDialog {...defaultProps} {...props} />);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AddMemberDialog", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render the add member title when no member is provided", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByText(/Add Member/i)).toBeInTheDocument();
    });

    it("should render the edit member title when an existing member is provided", () => {
        // Arrange & Act
        renderDialog({ member: existingMember });

        // Assert
        expect(screen.getByText(/Edit Member/i)).toBeInTheDocument();
    });

    it("should display the member name and email when editing an existing member", () => {
        // Arrange & Act
        renderDialog({ member: existingMember });

        // Assert
        expect(screen.getByText("Jane Doe")).toBeInTheDocument();
        expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    });

    it("should show the addable member search component when adding a new member", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByTestId("addable-member-mock")).toBeInTheDocument();
    });

    it("should have a role selector", () => {
        // Arrange & Act
        renderDialog({ member: existingMember });

        // Assert
        expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    });

    it("should have a cancel button", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByTestId("CancelButton")).toBeInTheDocument();
    });

    it("should have a save/add button", () => {
        // Arrange & Act
        renderDialog();

        // Assert
        expect(screen.getByTestId("SaveButton")).toBeInTheDocument();
    });

    it("should call cancelDialog and navigate back when cancel button is clicked", async () => {
        // Arrange
        const user = userEvent.setup();
        renderDialog();

        // Act
        await user.click(screen.getByTestId("CancelButton"));

        // Assert
        expect(mockCancelDialog).toHaveBeenCalledOnce();
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it("should show a warning message when the member is the sole owner", () => {
        // Arrange & Act
        renderDialog({ member: existingMember, isNotAloneOwner: false });

        // Assert
        expect(screen.getByText(/sole owner/i)).toBeInTheDocument();
    });

    it("should show an Ok button when the member is the sole owner", () => {
        // Arrange & Act
        renderDialog({ member: existingMember, isNotAloneOwner: false });

        // Assert
        expect(screen.getByTestId("OkButton")).toBeInTheDocument();
    });

    it("should call cancelDialog and navigate back when Ok button is clicked on sole-owner warning", async () => {
        // Arrange
        const user = userEvent.setup();
        renderDialog({ member: existingMember, isNotAloneOwner: false });

        // Act
        await user.click(screen.getByTestId("OkButton"));

        // Assert
        expect(mockCancelDialog).toHaveBeenCalledOnce();
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
});
