import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddThreatDialog from "./add-threat.dialog";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { createAsset, createProject, createThreat } from "#test-utils/builders.ts";
import { mockUseConfirm, mockUseDialog, mockUseThreatMeasuresList } from "#test-utils/mock-hooks.ts";
import { USER_ROLES } from "#api/types/user-roles.types.ts";

mockUseDialog();
mockUseConfirm();
mockUseThreatMeasuresList();

const navigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
    const actual = await importOriginal<typeof import("react-router-dom")>();
    return { ...actual, useNavigate: () => navigate };
});

const setup = (userRole: USER_ROLES = USER_ROLES.EDITOR) => {
    const project = createProject({ id: 7 });
    const threat = createThreat({
        id: 42,
        assets: [createAsset({ confidentiality: 4, integrity: 2, availability: 1 })],
    });
    const user = userEvent.setup();
    renderWithProviders(<AddThreatDialog threat={threat} project={project} userRole={userRole} open={true} />);
    return { project, threat, user };
};

describe("AddThreatDialog — Apply Measure button", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the Apply Measure button on the Measures tab for EDITOR role", async () => {
        const { user } = setup(USER_ROLES.EDITOR);

        await user.click(screen.getByRole("tab", { name: /measures/i }));

        expect(screen.getByRole("button", { name: /apply measure/i })).toBeInTheDocument();
    });

    it("does not render the Apply Measure button for VIEWER role", async () => {
        const { user } = setup(USER_ROLES.VIEWER);

        await user.click(screen.getByRole("tab", { name: /measures/i }));

        expect(screen.queryByRole("button", { name: /apply measure/i })).not.toBeInTheDocument();
    });

    it("navigates to the apply-measure route with the threat and computed damage on click", async () => {
        const { project, threat, user } = setup(USER_ROLES.EDITOR);

        await user.click(screen.getByRole("tab", { name: /measures/i }));
        await user.click(screen.getByRole("button", { name: /apply measure/i }));

        expect(navigate).toHaveBeenCalledOnce();
        expect(navigate).toHaveBeenCalledWith(`/projects/${project.id}/threats/measureImpacts/edit`, {
            state: {
                threat: { ...threat, damage: 4 },
                project,
            },
        });
    });
});
