import { screen } from "@testing-library/react";
import { createAsset } from "#test-utils/builders.ts";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { ThreatAssetsPopper } from "./threat-assets-popper.component";

describe("ThreatAssetsPopper", () => {
    it("lists each asset with its C/I/A ratings next to the hovered cell", () => {
        const anchor = document.createElement("div");
        document.body.appendChild(anchor);

        renderWithProviders(
            <ThreatAssetsPopper
                anchorEl={anchor}
                assets={[
                    createAsset({ id: 1, name: "Credentials", confidentiality: 5, integrity: 4, availability: 1 }),
                    createAsset({ id: 2, name: "Audit log", confidentiality: 2, integrity: 5, availability: 3 }),
                ]}
            />
        );

        expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
            "Credentials (C 5 / I 4 / A 1)",
            "Audit log (C 2 / I 5 / A 3)",
        ]);
        anchor.remove();
    });

    it("stays closed while no assets cell is hovered", () => {
        renderWithProviders(
            <ThreatAssetsPopper anchorEl={null} assets={[createAsset({ id: 1, name: "Credentials" })]} />
        );

        expect(screen.queryByText(/Credentials/)).not.toBeInTheDocument();
    });
});
