import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ComponentDialog from "./component.dialog";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { mockUseConfirm, mockUseDialog } from "#test-utils/mock-hooks.ts";
import { STANDARD_COMPONENT_TYPES } from "#api/types/standard-component.types.ts";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import type { ComponentType } from "#api/types/component-types.types.ts";

const confirmDialog = vi.fn();
mockUseDialog({ confirmDialog });
mockUseConfirm();

const navigate = vi.fn();
vi.mock("react-router", async (importOriginal) => {
    const actual = await importOriginal<typeof import("react-router")>();
    return { ...actual, useNavigate: () => navigate };
});
vi.mock("react-router-dom", async (importOriginal) => {
    const actual = await importOriginal<typeof import("react-router-dom")>();
    return { ...actual, useParams: () => ({ projectId: "7" }) };
});

const setup = (component?: ComponentType) => {
    const user = userEvent.setup();
    const result = renderWithProviders(<ComponentDialog open={true} component={component} />);
    return { user, ...result };
};

const fillName = async (user: ReturnType<typeof userEvent.setup>, value = "MyType") => {
    const nameField = screen.getByRole("textbox");
    await user.clear(nameField);
    await user.type(nameField, value);
};

const getCustomTile = (): HTMLElement => {
    const avatar = screen
        .getAllByLabelText(/upload custom icon/i)
        .find((element) => element.classList.contains("MuiAvatar-root"));
    if (!avatar) {
        throw new Error("custom upload Avatar tile not found");
    }
    return avatar;
};

const enableFirstPointOfAttack = async (user: ReturnType<typeof userEvent.setup>) => {
    const switches = screen.getAllByRole("switch");
    await user.click(switches[0]!);
};

describe("ComponentDialog — icon picker", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders four standard-icon tiles plus a custom-upload tile", () => {
        setup();
        expect(screen.getByAltText("Users")).toBeInTheDocument();
        expect(screen.getByAltText("Client")).toBeInTheDocument();
        expect(screen.getByAltText("Server")).toBeInTheDocument();
        expect(screen.getByAltText("Database")).toBeInTheDocument();
        expect(getCustomTile()).toBeInTheDocument();
    });

    it("shows the inline 'icon required' error when submitting without choosing an icon", async () => {
        const { user } = setup();
        await fillName(user);
        await enableFirstPointOfAttack(user);
        await user.click(screen.getByRole("button", { name: /save/i }));
        expect(await screen.findByText(/icon is required/i)).toBeInTheDocument();
        expect(confirmDialog).not.toHaveBeenCalled();
    });

    it("submits with the selected standardIcon and a null symbol", async () => {
        const { user } = setup();
        await fillName(user, "ServerType");
        await user.click(screen.getByAltText("Server"));
        await enableFirstPointOfAttack(user);
        await user.click(screen.getByRole("button", { name: /save/i }));

        await waitFor(() => expect(confirmDialog).toHaveBeenCalledOnce());
        expect(confirmDialog).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "ServerType",
                standardIcon: STANDARD_COMPONENT_TYPES.SERVER,
                symbol: null,
                projectId: 7,
            })
        );
    });

    it("preserves an existing standardIcon when editing without changes", async () => {
        const component: ComponentType = {
            id: 9,
            name: "Existing",
            symbol: null,
            standardIcon: STANDARD_COMPONENT_TYPES.SERVER,
            pointsOfAttack: [POINTS_OF_ATTACK.PROCESSING_INFRASTRUCTURE],
            projectId: 7,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const { user } = setup(component);
        await user.click(screen.getByRole("button", { name: /save/i }));

        await waitFor(() => expect(confirmDialog).toHaveBeenCalledOnce());
        expect(confirmDialog).toHaveBeenCalledWith(
            expect.objectContaining({
                standardIcon: STANDARD_COMPONENT_TYPES.SERVER,
                symbol: null,
            })
        );
    });

    it("preserves an uploaded symbol when editing without changes", async () => {
        const component: ComponentType = {
            id: 10,
            name: "Existing",
            symbol: "data:image/png;base64,AAAA",
            standardIcon: null,
            pointsOfAttack: [POINTS_OF_ATTACK.USER_INTERFACE],
            projectId: 7,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const { user } = setup(component);
        await user.click(screen.getByRole("button", { name: /save/i }));

        await waitFor(() => expect(confirmDialog).toHaveBeenCalledOnce());
        expect(confirmDialog).toHaveBeenCalledWith(
            expect.objectContaining({
                standardIcon: null,
                symbol: "data:image/png;base64,AAAA",
            })
        );
    });

    it("switching from custom upload to a standard icon clears the symbol on submit", async () => {
        const component: ComponentType = {
            id: 11,
            name: "Existing",
            symbol: "data:image/png;base64,AAAA",
            standardIcon: null,
            pointsOfAttack: [POINTS_OF_ATTACK.USER_INTERFACE],
            projectId: 7,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const { user } = setup(component);
        await user.click(screen.getByAltText("Client"));
        await user.click(screen.getByRole("button", { name: /save/i }));

        await waitFor(() => expect(confirmDialog).toHaveBeenCalledOnce());
        expect(confirmDialog).toHaveBeenCalledWith(
            expect.objectContaining({
                standardIcon: STANDARD_COMPONENT_TYPES.CLIENT,
                symbol: null,
            })
        );
    });

    it("clicking the already-selected standard icon does not unselect it", async () => {
        const { user } = setup();
        await fillName(user);
        await enableFirstPointOfAttack(user);

        await user.click(screen.getByAltText("Server"));
        await user.click(screen.getByAltText("Server")); // re-click — must stay selected
        await user.click(screen.getByRole("button", { name: /save/i }));

        await waitFor(() => expect(confirmDialog).toHaveBeenCalledOnce());
        expect(confirmDialog).toHaveBeenCalledWith(
            expect.objectContaining({
                standardIcon: STANDARD_COMPONENT_TYPES.SERVER,
                symbol: null,
            })
        );
    });
});
