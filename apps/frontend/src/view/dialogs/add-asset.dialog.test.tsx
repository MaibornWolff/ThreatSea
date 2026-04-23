import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddAssetDialog, { type AddAssetDialogProps } from "./add-asset.dialog";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { createAsset } from "#test-utils/builders.ts";
import { mockUseDialog } from "#test-utils/mock-hooks.ts";
import { USER_ROLES } from "#api/types/user-roles.types.ts";

mockUseDialog();

const navigate = vi.fn();
vi.mock("react-router", async (importOriginal) => {
    const actual = await importOriginal<typeof import("react-router")>();
    return { ...actual, useNavigate: () => navigate };
});

const validAsset = createAsset({ id: 1, name: "Existing Asset" });

const setup = (propsOverride: Partial<AddAssetDialogProps> = {}) => {
    const props = {
        projectId: 1,
        userRole: USER_ROLES.EDITOR,
        asset: validAsset,
        open: true,
        ...propsOverride,
    };
    const user = userEvent.setup();
    renderWithProviders(<AddAssetDialog {...props} />);
    return { props, user };
};

describe("AddAssetDialog — onDialogClose prop", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("calls onDialogClose instead of navigate(-1) when cancel is clicked", async () => {
        const onDialogClose = vi.fn();
        const { user } = setup({ onDialogClose });

        expect(onDialogClose).not.toHaveBeenCalled();

        await user.click(screen.getByTestId("cancel-button"));

        expect(onDialogClose).toHaveBeenCalledOnce();
        expect(navigate).not.toHaveBeenCalled();
    });

    it("falls back to navigate(-1) when onDialogClose is not provided", async () => {
        const { user } = setup();

        expect(navigate).not.toHaveBeenCalled();

        await user.click(screen.getByTestId("cancel-button"));

        expect(navigate).toHaveBeenCalledOnce();
        expect(navigate).toHaveBeenCalledWith(-1);
    });

    it("calls onDialogClose after form submission", async () => {
        const onDialogClose = vi.fn();
        const { user } = setup({ onDialogClose });

        await user.click(screen.getByTestId("save-button"));

        await waitFor(() => {
            expect(onDialogClose).toHaveBeenCalledOnce();
        });
        expect(navigate).not.toHaveBeenCalled();
    });

    it("calls navigate(-1) after form submission when onDialogClose is not provided", async () => {
        const { user } = setup();

        await user.click(screen.getByTestId("save-button"));

        await waitFor(() => {
            expect(navigate).toHaveBeenCalledOnce();
        });
        expect(navigate).toHaveBeenCalledWith(-1);
    });
});
