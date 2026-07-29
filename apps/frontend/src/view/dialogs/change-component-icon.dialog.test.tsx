import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { createSystemComponent } from "#test-utils/builders.ts";
import { STANDARD_ICON_IMAGES } from "#view/icons/standard-icons.ts";
import { STANDARD_COMPONENT_TYPES } from "#api/types/standard-component.types.ts";
import ChangeComponentIconDialog from "./change-component-icon.dialog";

const DATABASE_ICON = STANDARD_ICON_IMAGES[STANDARD_COMPONENT_TYPES.DATABASE];
const SERVER_ICON = STANDARD_ICON_IMAGES[STANDARD_COMPONENT_TYPES.SERVER];
const INFRA_ICON = STANDARD_ICON_IMAGES[STANDARD_COMPONENT_TYPES.COMMUNICATION_INFRASTRUCTURE];

describe("ChangeComponentIconDialog", () => {
    it("confirms the component's current icon when saved unchanged", async () => {
        const user = userEvent.setup();
        const onConfirm = vi.fn();
        const onClose = vi.fn();
        renderWithProviders(
            <ChangeComponentIconDialog
                component={createSystemComponent({ name: "Payment DB", symbol: DATABASE_ICON })}
                onClose={onClose}
                onConfirm={onConfirm}
            />
        );

        await user.click(screen.getByTestId("save-component-icon"));

        expect(onConfirm).toHaveBeenCalledWith(DATABASE_ICON);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("confirms a newly picked standard icon", async () => {
        const user = userEvent.setup();
        const onConfirm = vi.fn();
        renderWithProviders(
            <ChangeComponentIconDialog
                component={createSystemComponent({ name: "Payment DB", symbol: DATABASE_ICON })}
                onClose={vi.fn()}
                onConfirm={onConfirm}
            />
        );

        await user.click(screen.getByRole("button", { name: "Server" }));
        await user.click(screen.getByTestId("save-component-icon"));

        expect(onConfirm).toHaveBeenCalledWith(SERVER_ICON);
    });

    it("offers the communication infrastructure icon", async () => {
        const user = userEvent.setup();
        const onConfirm = vi.fn();
        renderWithProviders(
            <ChangeComponentIconDialog
                component={createSystemComponent({ name: "Internet", symbol: DATABASE_ICON })}
                onClose={vi.fn()}
                onConfirm={onConfirm}
            />
        );

        await user.click(screen.getByRole("button", { name: "Communication Infrastructure" }));
        await user.click(screen.getByTestId("save-component-icon"));

        expect(onConfirm).toHaveBeenCalledWith(INFRA_ICON);
    });

    it("disables saving when the component has no icon yet", () => {
        const onConfirm = vi.fn();
        renderWithProviders(
            <ChangeComponentIconDialog
                component={createSystemComponent({ name: "Blank", symbol: null })}
                onClose={vi.fn()}
                onConfirm={onConfirm}
            />
        );

        expect(screen.getByTestId("save-component-icon")).toBeDisabled();
    });

    it("rejects an invalid upload: raises an error and applies nothing", async () => {
        const user = userEvent.setup();
        const onConfirm = vi.fn();
        const { store } = renderWithProviders(
            <ChangeComponentIconDialog
                component={createSystemComponent({ name: "Blank", symbol: null })}
                onClose={vi.fn()}
                onConfirm={onConfirm}
            />
        );

        // The dialog renders in a portal, so query the document. image/png MIME passes the input's
        // `accept`, but the bytes are not a PNG, so validation rejects it.
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        await user.upload(fileInput, new File(["not a png"], "icon.png", { type: "image/png" }));

        // Error surfaced via the shared confirm dialog; the symbol was not applied.
        await waitFor(() => expect(store.getState().confirm.open).toBe(true));
        expect(onConfirm).not.toHaveBeenCalled();
        expect(screen.getByTestId("save-component-icon")).toBeDisabled();
    });
});
