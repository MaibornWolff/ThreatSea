import { screen } from "@testing-library/react";
import { ListBoxHeader } from "./list-box-header.component";
import { renderWithProviders } from "../../test-utils/render-with-providers";

describe("ListBoxHeader", () => {
    it("should render the title text", () => {
        renderWithProviders(<ListBoxHeader title="My Section" />);
        expect(screen.getByText("My Section")).toBeInTheDocument();
    });

    it("should render the title as an h6 heading", () => {
        renderWithProviders(<ListBoxHeader title="Threats" />);
        expect(screen.getByRole("heading", { level: 6, name: "Threats" })).toBeInTheDocument();
    });

    it("should render React node children as the title", () => {
        renderWithProviders(
            <ListBoxHeader
                title={
                    <span data-testid="custom-title">
                        Custom <strong>Title</strong>
                    </span>
                }
            />
        );
        expect(screen.getByTestId("custom-title")).toBeInTheDocument();
        expect(screen.getByText("Title")).toBeInTheDocument();
    });
});
