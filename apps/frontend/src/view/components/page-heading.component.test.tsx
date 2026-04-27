import { render, screen } from "@testing-library/react";
import { PageHeading } from "./page-heading.component";

describe("PageHeading", () => {
    it("should render its children as a heading", () => {
        render(<PageHeading>My Page Title</PageHeading>);
        expect(screen.getByRole("heading", { name: "My Page Title" })).toBeInTheDocument();
    });

    it("should render an h5 element", () => {
        render(<PageHeading>Title</PageHeading>);
        expect(screen.getByRole("heading", { level: 5 })).toBeInTheDocument();
    });

    it("should render React node children", () => {
        render(
            <PageHeading>
                <span data-testid="inner">Nested</span>
            </PageHeading>
        );
        expect(screen.getByTestId("inner")).toBeInTheDocument();
        expect(screen.getByText("Nested")).toBeInTheDocument();
    });
});
