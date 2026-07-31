import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FolderDialog from "./folder.dialog";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { createFolder } from "#test-utils/builders.ts";
import { mockUseDialog } from "#test-utils/mock-hooks.ts";

const confirmDialog = vi.fn();
const cancelDialog = vi.fn();
mockUseDialog({ confirmDialog, cancelDialog });

const navigate = vi.fn();
vi.mock("react-router", async (importOriginal) => {
    const actual = await importOriginal<typeof import("react-router")>();
    return { ...actual, useNavigate: () => navigate };
});

const setup = (props: Partial<React.ComponentProps<typeof FolderDialog>> = {}) => {
    const user = userEvent.setup();
    renderWithProviders(<FolderDialog open folder={undefined} parentId={null} {...props} />);
    return { user };
};

describe("FolderDialog", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("shows the create title when no folder is given", () => {
        setup();
        expect(screen.getByText("New folder")).toBeInTheDocument();
    });

    it("shows the rename title when a folder is given", () => {
        setup({ folder: createFolder({ id: 4, name: "Payments" }) });
        expect(screen.getByText("Rename folder")).toBeInTheDocument();
    });

    it("cancels via cancelDialog and navigates back", async () => {
        const { user } = setup();

        await user.click(screen.getByTestId("cancel-button"));

        expect(cancelDialog).toHaveBeenCalledOnce();
        expect(navigate).toHaveBeenCalledWith(-1);
    });

    it("confirms a create with the entered name, its parent, and no id", async () => {
        const { user } = setup({ parentId: 2 });

        await user.type(screen.getByRole("textbox"), "New folder name");
        await user.click(screen.getByTestId("save-button"));

        await waitFor(() => expect(confirmDialog).toHaveBeenCalledTimes(1));
        const payload = confirmDialog.mock.calls[0]![0];
        expect(payload.name).toBe("New folder name");
        expect(payload.parentId).toBe(2);
        expect(payload.id).toBeUndefined();
    });

    it("confirms a rename carrying the folder id", async () => {
        const { user } = setup({ folder: createFolder({ id: 4, name: "Old" }) });

        const input = screen.getByRole("textbox");
        await user.clear(input);
        await user.type(input, "New name");
        await user.click(screen.getByTestId("save-button"));

        await waitFor(() => expect(confirmDialog).toHaveBeenCalledTimes(1));
        const payload = confirmDialog.mock.calls[0]![0];
        expect(payload.id).toBe(4);
        expect(payload.name).toBe("New name");
    });

    it("does not confirm when the name is left empty", async () => {
        const { user } = setup();

        await user.click(screen.getByTestId("save-button"));

        // The required-name validation blocks submission, so no dialog value is confirmed.
        await waitFor(() => expect(screen.getByRole("textbox")).toBeInvalid());
        expect(confirmDialog).not.toHaveBeenCalled();
    });
});
