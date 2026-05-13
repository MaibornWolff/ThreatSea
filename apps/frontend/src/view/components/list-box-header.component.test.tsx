import { render, screen } from "@testing-library/react";
import { ListBoxHeader } from "./list-box-header.component";

describe("ListBoxHeader", () => {
    it("should render the title text", () => {
        render(<ListBoxHeader title="My Section" />);
        expect(screen.getByText("My Section")).toBeInTheDocument();
    });

    it("should render the title as an h6 heading", () => {
        render(<ListBoxHeader title="Threats" />);
        expect(screen.getByRole("heading", { level: 6, name: "Threats" })).toBeInTheDocument();
    });

    it("should render React node children as the title", () => {
        render(
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
