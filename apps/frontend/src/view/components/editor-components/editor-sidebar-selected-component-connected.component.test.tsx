import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
    EditorSidebarSelectedComponentConnected,
    type EditorSidebarSelectedComponentConnectedProps,
} from "./editor-sidebar-selected-component-connected.component";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { createConnectedComponent, createSystemComponent } from "#test-utils/builders.ts";

const connectedNames = () => screen.getAllByTestId("connected-component-name").map((element) => element.textContent);

const setup = (propsOverride: Partial<EditorSidebarSelectedComponentConnectedProps> = {}) => {
    const props: EditorSidebarSelectedComponentConnectedProps = {
        selectedComponent: createSystemComponent(),
        connectedComponents: [
            createConnectedComponent({ component: createSystemComponent({ id: "c-gamma", name: "Gamma" }) }),
            createConnectedComponent({ component: createSystemComponent({ id: "c-alpha", name: "Alpha" }) }),
            createConnectedComponent({ component: createSystemComponent({ id: "c-beta", name: "Beta" }) }),
        ],
        handleSelectConnectedComponent: vi.fn(),
        handleDeleteConnectionBetweenComponents: vi.fn(),
        ...propsOverride,
    };
    const user = userEvent.setup();
    renderWithProviders(<EditorSidebarSelectedComponentConnected {...props} />);
    return { props, user };
};

describe("EditorSidebarSelectedComponentConnected — sorting & filtering", () => {
    describe("sorting", () => {
        it("renders connected components alphabetically ascending by default", () => {
            setup();

            expect(connectedNames()).toEqual(["Alpha", "Beta", "Gamma"]);
        });

        it("reverses to descending when the descending sort button is clicked", async () => {
            const { user } = setup();

            await user.click(screen.getByTestId("connected-component-descending-sort-button"));

            expect(connectedNames()).toEqual(["Gamma", "Beta", "Alpha"]);
        });

        it("returns to ascending when the ascending sort button is clicked", async () => {
            const { user } = setup();

            await user.click(screen.getByTestId("connected-component-descending-sort-button"));
            await user.click(screen.getByTestId("connected-component-ascending-sort-button"));

            expect(connectedNames()).toEqual(["Alpha", "Beta", "Gamma"]);
        });
    });

    describe("filtering", () => {
        it("shows only components whose name matches the search value", async () => {
            const { user } = setup();

            await user.type(screen.getByRole("textbox"), "beta");

            expect(connectedNames()).toEqual(["Beta"]);
        });

        it("matches case-insensitively on a substring of the name", async () => {
            const { user } = setup();

            await user.type(screen.getByRole("textbox"), "AM");

            expect(connectedNames()).toEqual(["Gamma"]);
        });

        it("renders no rows when nothing matches", async () => {
            const { user } = setup();

            await user.type(screen.getByRole("textbox"), "no-such-component");

            expect(screen.queryByTestId("connected-component-name")).not.toBeInTheDocument();
        });

        it("keeps the ascending order among the filtered results", async () => {
            const { user } = setup({
                connectedComponents: [
                    createConnectedComponent({ component: createSystemComponent({ id: "c-1", name: "Service B" }) }),
                    createConnectedComponent({ component: createSystemComponent({ id: "c-2", name: "Service A" }) }),
                    createConnectedComponent({ component: createSystemComponent({ id: "c-3", name: "Database" }) }),
                ],
            });

            await user.type(screen.getByRole("textbox"), "service");

            expect(connectedNames()).toEqual(["Service A", "Service B"]);
        });
    });
});
