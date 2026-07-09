import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { IconSelector } from "./icon-selector.component";

describe("IconSelector", () => {
    it("renders the helper text", () => {
        renderWithProviders(<IconSelector label="Icon" onChange={vi.fn()} helperText="Pick an icon" />);

        expect(screen.getByText("Pick an icon")).toBeInTheDocument();
    });

    it("reflects the pre-selected icon in the closed control", () => {
        renderWithProviders(<IconSelector label="Icon" value="Bluetooth" onChange={vi.fn()} />);

        expect(screen.getByTestId("BluetoothIcon")).toBeInTheDocument();
    });

    it("calls onChange with the chosen icon name when an icon is picked", async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        renderWithProviders(<IconSelector label="Icon" onChange={onChange} />);

        await user.click(screen.getByRole("combobox"));
        await user.click(screen.getByTestId("WifiIcon"));

        expect(onChange).toHaveBeenCalledWith("Wifi");
    });

    it("filters the icon grid by the search term", async () => {
        const user = userEvent.setup();
        renderWithProviders(<IconSelector label="Icon" onChange={vi.fn()} />);

        await user.click(screen.getByRole("combobox"));
        expect(screen.getByTestId("RouterIcon")).toBeInTheDocument();

        await user.type(screen.getByPlaceholderText("Search icons..."), "usb");

        expect(await screen.findByTestId("UsbIcon")).toBeInTheDocument();
        expect(screen.queryByTestId("RouterIcon")).not.toBeInTheDocument();
    });
});
