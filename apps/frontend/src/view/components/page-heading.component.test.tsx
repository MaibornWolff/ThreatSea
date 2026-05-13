import { screen } from "@testing-library/react";
import { PageHeading } from "./page-heading.component";
import { renderWithProviders } from "../../test-utils/render-with-providers";

describe("PageHeading", () => {
    it("should render its children as a heading", () => {
        renderWithProviders(<PageHeading>My Page Title</PageHeading>);
        expect(screen.getByRole("heading", { name: "My Page Title" })).toBeInTheDocument();
    });

    it("should render an h5 element", () => {
        renderWithProviders(<PageHeading>Title</PageHeading>);
        expect(screen.getByRole("heading", { level: 5 })).toBeInTheDocument();
    });

    it("should render React node children", () => {
        renderWithProviders(
            <PageHeading>
                <span data-testid="inner">Nested</span>
            </PageHeading>
        );
        expect(screen.getByTestId("inner")).toBeInTheDocument();
        expect(screen.getByText("Nested")).toBeInTheDocument();
    });
});
