import { render, screen, waitFor } from "@testing-library/react";
import { DynamicMuiIcon } from "./dynamic-mui-icon.component";

// The generated icon maps are produced by vitest.global-setup.ts before the
// suite runs, so real icon names ("Wifi") resolve to actual path data.

describe("DynamicMuiIcon", () => {
    it("renders the named icon with the @mui/icons-material data-testid convention", async () => {
        render(<DynamicMuiIcon iconName="Wifi" />);

        expect(await screen.findByTestId("WifiIcon")).toBeInTheDocument();
    });

    it("draws an SVG path for the icon", async () => {
        const { container } = render(<DynamicMuiIcon iconName="Wifi" />);

        await screen.findByTestId("WifiIcon");
        expect(container.querySelector("path")).toBeInTheDocument();
    });

    it("renders nothing for an unknown icon name", async () => {
        // Load the maps first so the unknown name is a genuine miss, not just unloaded.
        render(<DynamicMuiIcon iconName="Wifi" />);
        await screen.findByTestId("WifiIcon");

        const { container } = render(<DynamicMuiIcon iconName="TotallyNotARealIcon" />);

        await waitFor(() => expect(container.querySelector("svg")).not.toBeInTheDocument());
        expect(screen.queryByTestId("TotallyNotARealIconIcon")).not.toBeInTheDocument();
    });

    it("forwards SvgIcon props such as fontSize", async () => {
        render(<DynamicMuiIcon iconName="Wifi" fontSize="large" />);

        const icon = await screen.findByTestId("WifiIcon");
        expect(icon).toHaveClass("MuiSvgIcon-fontSizeLarge");
    });
});
