import { render, screen } from "@testing-library/react";
import { ListBox } from "./list-box.component";

describe("ListBox", () => {
    it("should render its children", () => {
        render(<ListBox>Box content</ListBox>);
        expect(screen.getByText("Box content")).toBeInTheDocument();
    });

    it("should render React node children", () => {
        render(
            <ListBox>
                <span data-testid="inner">Nested</span>
            </ListBox>
        );
        expect(screen.getByTestId("inner")).toBeInTheDocument();
    });

    it("should forward additional props to the underlying Box", () => {
        render(<ListBox data-testid="my-list-box">Content</ListBox>);
        expect(screen.getByTestId("my-list-box")).toBeInTheDocument();
    });

    it("should render multiple children", () => {
        render(
            <ListBox>
                <span>First</span>
                <span>Second</span>
            </ListBox>
        );
        expect(screen.getByText("First")).toBeInTheDocument();
        expect(screen.getByText("Second")).toBeInTheDocument();
    });
});
