import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddAssetDialog, { type AddAssetDialogProps } from "./add-asset.dialog";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { createAsset } from "#test-utils/builders.ts";
import { mockUseDialog } from "#test-utils/mock-hooks.ts";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { translationUtil } from "#utils/translations.ts";
import { MIN_CIA_VALUE, MAX_CIA_VALUE } from "./validation-constants";

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

describe("AddAssetDialog — CIA value validation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const fields = [
        {
            label: translationUtil.t("confidentiality"),
            maxErrorKey: "errorMessages.confidentialityMax",
            minErrorKey: "errorMessages.confidentialityMin",
        },
        {
            label: translationUtil.t("integrity"),
            maxErrorKey: "errorMessages.integrityMax",
            minErrorKey: "errorMessages.integrityMin",
        },
        {
            label: translationUtil.t("availability"),
            maxErrorKey: "errorMessages.availabilityMax",
            minErrorKey: "errorMessages.availabilityMin",
        },
    ] as const;

    it.each(fields)(
        "blocks submit and shows max-value error when $label exceeds MAX_CIA_VALUE",
        async ({ label, maxErrorKey }) => {
            const { user } = setup();
            const input = screen.getByLabelText(label);

            await user.clear(input);
            await user.type(input, String(MAX_CIA_VALUE + 1));
            await user.click(screen.getByTestId("save-button"));

            expect(await screen.findByText(translationUtil.t(maxErrorKey))).toBeInTheDocument();
            expect(navigate).not.toHaveBeenCalled();
        }
    );

    it.each(fields)(
        "blocks submit and shows min-value error when $label is below MIN_CIA_VALUE",
        async ({ label, minErrorKey }) => {
            const { user } = setup();
            const input = screen.getByLabelText(label);

            await user.clear(input);
            await user.type(input, String(MIN_CIA_VALUE - 1));
            await user.click(screen.getByTestId("save-button"));

            expect(await screen.findByText(translationUtil.t(minErrorKey))).toBeInTheDocument();
            expect(navigate).not.toHaveBeenCalled();
        }
    );

    it.each(fields)("constrains the $label input via min/max HTML attributes", ({ label }) => {
        setup();
        const input = screen.getByLabelText(label);

        expect(input).toHaveAttribute("min", String(MIN_CIA_VALUE));
        expect(input).toHaveAttribute("max", String(MAX_CIA_VALUE));
    });

    it("submits when all CIA values are within range", async () => {
        const { user } = setup();

        await user.click(screen.getByTestId("save-button"));

        await waitFor(() => {
            expect(navigate).toHaveBeenCalledWith(-1);
        });
    });
});

describe("AddAssetDialog — save button disabled state", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("disables save when the user lacks the editor role", () => {
        setup({ userRole: USER_ROLES.VIEWER });

        expect(screen.getByTestId("save-button")).toBeDisabled();
    });

    it("disables save after a CIA value becomes invalid", async () => {
        const { user } = setup();
        expect(screen.getByTestId("save-button")).toBeEnabled();

        const input = screen.getByLabelText(translationUtil.t("confidentiality"));
        await user.clear(input);
        await user.type(input, String(MAX_CIA_VALUE + 1));
        await user.tab();

        await waitFor(() => {
            expect(screen.getByTestId("save-button")).toBeDisabled();
        });
    });

    it("re-enables save once the invalid CIA value is corrected", async () => {
        const { user } = setup();
        const input = screen.getByLabelText(translationUtil.t("confidentiality"));

        await user.clear(input);
        await user.type(input, String(MAX_CIA_VALUE + 1));
        await user.tab();

        await waitFor(() => {
            expect(screen.getByTestId("save-button")).toBeDisabled();
        });

        await user.clear(input);
        await user.type(input, String(MAX_CIA_VALUE));
        await user.tab();

        await waitFor(() => {
            expect(screen.getByTestId("save-button")).toBeEnabled();
        });
    });
});
