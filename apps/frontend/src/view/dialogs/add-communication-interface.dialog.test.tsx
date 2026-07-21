import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommunicationInterfaceDialog from "./add-communication-interface.dialog";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { createCommunicationInterface } from "#test-utils/builders.ts";
import { mockUseDialog } from "#test-utils/mock-hooks.ts";
import type { SystemCommunicationInterface } from "#api/types/system.types.ts";

mockUseDialog();

const setup = (propsOverride: { communicationInterface?: SystemCommunicationInterface } = {}) => {
    const handleCreateNew = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
        <CommunicationInterfaceDialog
            open={true}
            onClose={onClose}
            handleCreateNew={handleCreateNew}
            {...propsOverride}
        />
    );
    return { handleCreateNew, onClose, user };
};

describe("CommunicationInterfaceDialog — default interface icon (#860)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("preselects a default icon so a new interface shows one without opening the picker", () => {
        setup();

        expect(screen.getByTestId("DeviceHubIcon")).toBeInTheDocument();
    });

    it("stores the default icon on save when the user never opens the icon picker", async () => {
        const { handleCreateNew, user } = setup();

        await user.type(screen.getByRole("textbox"), "Ethernet port");
        await user.click(screen.getByRole("button", { name: /save/i }));

        await waitFor(() => expect(handleCreateNew).toHaveBeenCalledOnce());
        expect(handleCreateNew).toHaveBeenCalledWith(
            expect.objectContaining({ name: "Ethernet port", icon: "DeviceHub" })
        );
    });

    it("keeps the existing icon instead of the default when editing an interface", async () => {
        const communicationInterface = createCommunicationInterface({ name: "Existing", icon: "Wifi" });
        const { handleCreateNew, user } = setup({ communicationInterface });

        await user.click(screen.getByRole("button", { name: /save/i }));

        await waitFor(() => expect(handleCreateNew).toHaveBeenCalledOnce());
        expect(handleCreateNew).toHaveBeenCalledWith(expect.objectContaining({ icon: "Wifi" }));
    });
});
