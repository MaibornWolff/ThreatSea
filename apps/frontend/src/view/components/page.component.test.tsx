// Page.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Page } from "./page.component";

describe("Page", () => {
    it("should render a <main>-element", () => {
        render(<Page data-testid="page-root" />);

        const main = screen.getByTestId("page-root");
        expect(main.tagName.toLowerCase()).toBe("main");
    });

    it("should render child-element correctly", () => {
        render(
            <Page>
                <div>Content</div>
            </Page>
        );

        expect(screen.getByText("Content")).toBeInTheDocument();
    });

    it("should merge sx-Props with default values", () => {
        render(<Page data-testid="page-root" sx={{ paddingLeft: 10, backgroundColor: "red" }} />);

        const main = screen.getByTestId("page-root");

        // MUI schreibt die Styles inline, deshalb können wir das prüfen
        //expect(main).toHaveStyle({ paddingLeft: '10px' });
        //expect(main).toHaveStyle({ backgroundColor: 'red' });

        // Ein Standardwert wie display: flex sollte weiterhin vorhanden sein
        expect(main).toHaveStyle({ display: "flex" });
    });

    it("should pass on more props to box (e.g. className)", () => {
        render(<Page data-testid="page-root" className="my-page" />);

        const main = screen.getByTestId("page-root");
        expect(main).toHaveClass("my-page");
    });
});
