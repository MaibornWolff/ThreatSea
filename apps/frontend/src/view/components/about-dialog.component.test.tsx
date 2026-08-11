import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { translationUtil } from "#utils/translations.ts";
import { AboutDialog } from "./about-dialog.component";

describe("AboutDialog", () => {
    it("shows the app name, version, license and repository link when open", () => {
        renderWithProviders(<AboutDialog open onClose={vi.fn()} />);

        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveTextContent("ThreatSea");
        // Tests run without VITE_APP_VERSION, so the fallback label is shown.
        expect(screen.getByTestId("about-dialog_version")).toHaveTextContent("local dev");
        expect(dialog).toHaveTextContent("BSD-3-Clause");

        const repoLink = screen.getByRole("link", {
            name: translationUtil.t("aboutDialog.repository", { ns: "mainMenu" }),
        });
        expect(repoLink).toHaveAttribute("href", "https://github.com/MaibornWolff/ThreatSea");
    });

    it("renders nothing when closed", () => {
        renderWithProviders(<AboutDialog open={false} onClose={vi.fn()} />);

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("calls onClose when the close button is clicked", async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        renderWithProviders(<AboutDialog open onClose={onClose} />);

        await user.click(screen.getByRole("button", { name: translationUtil.t("cancelBtn", { ns: "common" }) }));

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
