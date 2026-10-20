import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import {
    UnsavedLineOfToleranceDialog,
    type UnsavedLineOfToleranceDialogProps,
} from "./unsaved-line-of-tolerance.dialog";

const onStay = vi.fn();
const onDiscard = vi.fn();
const onSave = vi.fn();

const setup = (props: Partial<UnsavedLineOfToleranceDialogProps> = {}) => {
    const user = userEvent.setup();
    renderWithProviders(
        <UnsavedLineOfToleranceDialog
            open
            isSaving={false}
            onStay={onStay}
            onDiscard={onDiscard}
            onSave={onSave}
            {...props}
        />
    );
    return { user };
};

describe("UnsavedLineOfToleranceDialog", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("tells the user that leaving discards the unsaved line of tolerance", () => {
        setup();

        expect(
            screen.getByText("The line of tolerance has unsaved changes. Leaving the page discards them.")
        ).toBeInTheDocument();
    });

    it("renders nothing while closed", () => {
        setup({ open: false });

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it.each([
        ["Stay", onStay],
        ["Discard and leave", onDiscard],
        ["Save and leave", onSave],
    ])("runs the matching action for %s", async (name, handler) => {
        const { user } = setup();

        await user.click(screen.getByRole("button", { name }));

        expect(handler).toHaveBeenCalledTimes(1);
    });

    it("disables every choice while saving", () => {
        setup({ isSaving: true });

        for (const name of ["Stay", "Discard and leave", "Save and leave"]) {
            expect(screen.getByRole("button", { name })).toBeDisabled();
        }
    });
});
