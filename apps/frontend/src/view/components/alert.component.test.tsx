import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { mockUseAlert } from "#test-utils/mock-hooks.ts";
import {
    errorDefaultState,
    ERR_TYPE_API,
    ERR_TYPE_PROJECT_CATALOG_EXISTANCE,
} from "#application/reducers/error.reducer.ts";

const navigate = vi.fn();
vi.mock("react-router", async (importOriginal) => {
    const actual = await importOriginal<typeof import("react-router")>();
    return { ...actual, useNavigate: () => navigate };
});

import { Alert } from "./alert.component";

const errorState = (overrides: Partial<typeof errorDefaultState> = {}) => ({ ...errorDefaultState, ...overrides });

const setupError = (error: Partial<typeof errorDefaultState>, initialEntries?: string[]) => {
    const showErrorMessage = vi.fn();
    mockUseAlert({ visible: false, showErrorMessage });
    renderWithProviders(<Alert />, {
        preloadedState: { error: errorState(error) },
        ...(initialEntries && { initialEntries }),
    });
    return { showErrorMessage };
};

describe("Alert — visibility", () => {
    it("renders nothing while not visible", () => {
        mockUseAlert({ visible: false, text: "Saved" });

        renderWithProviders(<Alert />);

        expect(screen.queryByText("Saved")).not.toBeInTheDocument();
    });

    it("renders the message text when visible", () => {
        mockUseAlert({ visible: true, text: "Saved successfully", type: "success" });

        renderWithProviders(<Alert />);

        expect(screen.getByText("Saved successfully")).toBeInTheDocument();
    });

    it("invokes close when the close button is clicked", async () => {
        const close = vi.fn();
        mockUseAlert({ visible: true, text: "Saved", type: "success", close });
        const user = userEvent.setup();

        renderWithProviders(<Alert />);
        await user.click(screen.getByRole("button", { name: /close/i }));

        expect(close).toHaveBeenCalledTimes(1);
    });
});

describe("Alert — error side effects", () => {
    it("does nothing when there is no error", () => {
        const { showErrorMessage } = setupError({});

        expect(navigate).not.toHaveBeenCalled();
        expect(showErrorMessage).not.toHaveBeenCalled();
    });

    it("redirects to /login and surfaces the message on an authentication error", () => {
        const { showErrorMessage } = setupError({ type: ERR_TYPE_API, message: "Session expired" }, ["/projects"]);

        expect(navigate).toHaveBeenCalledWith("/login", { replace: true });
        expect(showErrorMessage).toHaveBeenCalledWith({ message: "Session expired" });
    });

    it("does not redirect again when already on the login page", () => {
        const { showErrorMessage } = setupError({ type: ERR_TYPE_API, message: "Session expired" }, ["/login"]);

        expect(navigate).not.toHaveBeenCalled();
        expect(showErrorMessage).toHaveBeenCalledWith({ message: "Session expired" });
    });

    it("redirects to /projects on a project/catalog existence error", () => {
        const { showErrorMessage } = setupError({ type: ERR_TYPE_PROJECT_CATALOG_EXISTANCE, message: "Gone" }, [
            "/projects/1",
        ]);

        expect(navigate).toHaveBeenCalledWith("/projects", { replace: true });
        expect(showErrorMessage).toHaveBeenCalledWith({ message: "Gone" });
    });
});
