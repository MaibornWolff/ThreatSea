import { render, screen } from "@testing-library/react";
import { AssetSecurityNeedsPopper } from "./asset-security-needs-popper.component";
import { createAsset } from "#test-utils/builders.ts";

describe("AssetSecurityNeedsPopper", () => {
    it("renders nothing visible when anchorEl is null", () => {
        const asset = createAsset({ confidentiality: 4, integrity: 3, availability: 2 });

        render(<AssetSecurityNeedsPopper anchorEl={null} asset={asset} />);

        expect(screen.queryByText(/^\(C \d+ \/ I \d+ \/ A \d+\)$/)).not.toBeInTheDocument();
    });

    it("renders the (C / I / A) text when an anchorEl and asset are provided", () => {
        const anchor = document.createElement("span");
        document.body.appendChild(anchor);
        const asset = createAsset({ confidentiality: 4, integrity: 3, availability: 2 });

        render(<AssetSecurityNeedsPopper anchorEl={anchor} asset={asset} />);

        expect(screen.getByText("(C 4 / I 3 / A 2)")).toBeInTheDocument();
    });

    it("formats boundary values 0 and 5 verbatim", () => {
        const anchor = document.createElement("span");
        document.body.appendChild(anchor);
        const asset = createAsset({ confidentiality: 0, integrity: 5, availability: 0 });

        render(<AssetSecurityNeedsPopper anchorEl={anchor} asset={asset} />);

        expect(screen.getByText("(C 0 / I 5 / A 0)")).toBeInTheDocument();
    });

    it("renders no security-need text when anchorEl is provided but asset is null", () => {
        const anchor = document.createElement("span");
        document.body.appendChild(anchor);

        render(<AssetSecurityNeedsPopper anchorEl={anchor} asset={null} />);

        expect(screen.queryByText(/^\(C \d+ \/ I \d+ \/ A \d+\)$/)).not.toBeInTheDocument();
    });
});
