import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, Route, Routes, useLocation } from "react-router";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { ChainDialogContent } from "./chain-dialog-content.component";
import { ChainDialogShell } from "./chain-dialog-shell.component";

const DIALOG_A = "/projects/7/threats/a";
const DIALOG_B = "/projects/7/threats/b";

const LocationProbe = () => <div data-testid="location">{useLocation().pathname}</div>;

const renderShell = (initialEntries: string[]) =>
    renderWithProviders(
        <>
            <Routes>
                <Route
                    path="/projects/:projectId/threats/*"
                    element={
                        <Routes>
                            <Route element={<ChainDialogShell />}>
                                <Route
                                    path="a"
                                    element={
                                        <ChainDialogContent size="md">
                                            <Link to={DIALOG_B}>dialog A</Link>
                                        </ChainDialogContent>
                                    }
                                />
                                <Route
                                    path="b"
                                    element={
                                        <ChainDialogContent size="sm">
                                            <Link to={DIALOG_A}>dialog B</Link>
                                        </ChainDialogContent>
                                    }
                                />
                            </Route>
                        </Routes>
                    }
                />
            </Routes>
            <LocationProbe />
        </>,
        { initialEntries }
    );

const backdrop = () => screen.getByRole("dialog").closest(".MuiDialog-root")?.querySelector(".MuiBackdrop-root");

describe("ChainDialogShell", () => {
    it("keeps the same backdrop when one chain dialog replaces another", async () => {
        renderShell([DIALOG_A]);
        const backdropBefore = backdrop();
        expect(backdropBefore).not.toBeNull();

        await userEvent.click(screen.getByText("dialog A"));

        expect(screen.getByText("dialog B")).toBeInTheDocument();
        expect(backdrop()).toBe(backdropBefore);
    });

    it("goes back one step on a backdrop click and stays open", async () => {
        renderShell([DIALOG_A, DIALOG_B]);

        await userEvent.click(backdrop() as Element);

        expect(screen.getByTestId("location")).toHaveTextContent(DIALOG_A);
        expect(screen.getByRole("dialog")).toHaveTextContent("dialog A");
    });

    it("ignores Escape", async () => {
        renderShell([DIALOG_A, DIALOG_B]);

        await userEvent.keyboard("{Escape}");

        expect(screen.getByTestId("location")).toHaveTextContent(DIALOG_B);
        expect(screen.getByRole("dialog")).toHaveTextContent("dialog B");
    });

    it("renders nothing when no chain dialog matches", () => {
        renderShell(["/projects/7/threats"]);

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
});
