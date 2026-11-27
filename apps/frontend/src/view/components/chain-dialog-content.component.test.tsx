import { screen } from "@testing-library/react";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { ChainDialogContent } from "./chain-dialog-content.component";

describe("ChainDialogContent", () => {
    it.each([
        { size: "sm", width: "600px" },
        { size: "md", width: "900px" },
    ] as const)("sizes the $size dialog to $width", ({ size, width }) => {
        renderWithProviders(<ChainDialogContent size={size}>content</ChainDialogContent>);

        expect(screen.getByText("content")).toHaveStyle({ width });
    });
});
