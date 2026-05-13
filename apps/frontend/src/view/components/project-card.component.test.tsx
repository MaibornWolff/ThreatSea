import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectCard } from "./project-card.component";
import { renderWithProviders } from "../../test-utils/render-with-providers";
import { createProject } from "../../test-utils/builders";
import { USER_ROLES } from "../../api/types/user-roles.types";

// useProjectExport pulls in Redux — mock it to keep tests focused on the card UI.
vi.mock("../../application/hooks/use-export.hook", () => ({
    useProjectExport: () => ({ exportProject: vi.fn() }),
}));

// ProjectCard uses useNavigate from "react-router". Even though renderWithProviders
// wraps in MemoryRouter (from react-router-dom), the two packages resolve to
// separate module instances in the test environment, so the router context is
// not shared. Mock useNavigate to avoid the "may only be used inside a <Router>"
// invariant while keeping all other react-router exports intact.
const navigate = vi.fn();
vi.mock("react-router", async (importOriginal) => {
    const actual = await importOriginal<typeof import("react-router")>();
    return { ...actual, useNavigate: () => navigate };
});

const setup = (overrides: Parameters<typeof createProject>[0] = {}) => {
    const project = createProject(overrides);
    const onClickEditProject = vi.fn();
    const onClickDeleteProject = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
        <ProjectCard
            project={project}
            onClickEditProject={onClickEditProject}
            onClickDeleteProject={onClickDeleteProject}
        />
    );

    return { project, onClickEditProject, onClickDeleteProject, user };
};

describe("ProjectCard", () => {
    describe("static content", () => {
        it("renders the project name", () => {
            setup({ name: "My Project" });
            expect(screen.getByTestId("projects-page_project-card_project-name")).toHaveTextContent("My Project");
        });

        it("renders the card container", () => {
            setup();
            expect(screen.getByTestId("projects-page_project-card")).toBeInTheDocument();
        });

        it("renders the creation date in ISO format", () => {
            setup({ createdAt: new Date("2024-06-15") });
            expect(screen.getByText("2024-06-15")).toBeInTheDocument();
        });
    });

    describe("navigation buttons", () => {
        it("renders the System button", () => {
            setup();
            expect(screen.getByTestId("projects-page_project-card_system-button")).toBeInTheDocument();
        });

        it("renders the Assets button", () => {
            setup();
            expect(screen.getByTestId("projects-page_project-card_assets-button")).toBeInTheDocument();
        });

        it("renders the Threats button", () => {
            setup();
            expect(screen.getByTestId("projects-page_project-card_threats-button")).toBeInTheDocument();
        });

        it("renders the Measures button", () => {
            setup();
            expect(screen.getByTestId("projects-page_project-card_measures-button")).toBeInTheDocument();
        });

        it("renders the Risk button", () => {
            setup();
            expect(screen.getByTestId("projects-page_project-card_risk-button")).toBeInTheDocument();
        });

        it("renders the Report button", () => {
            setup();
            expect(screen.getByTestId("projects-page_project-card_report-button")).toBeInTheDocument();
        });

        it("renders the Members button for EDITOR role", () => {
            setup({ role: USER_ROLES.EDITOR });
            expect(screen.getByTestId("projects-page_project-card_members-button")).toBeInTheDocument();
        });

        it("does not render the Members button for VIEWER role", () => {
            setup({ role: USER_ROLES.VIEWER });
            expect(screen.queryByTestId("projects-page_project-card_members-button")).not.toBeInTheDocument();
        });
    });

    describe("owner action menu", () => {
        it("renders the action menu button for OWNER role", () => {
            setup({ role: USER_ROLES.OWNER });
            expect(screen.getByTestId("projects-page_project-card_action-menu-button")).toBeInTheDocument();
        });

        it("does not render the action menu button for VIEWER role", () => {
            setup({ role: USER_ROLES.VIEWER });
            expect(screen.queryByTestId("projects-page_project-card_action-menu-button")).not.toBeInTheDocument();
        });

        it("opens the action menu when the menu button is clicked", async () => {
            const { user } = setup({ role: USER_ROLES.OWNER });

            await user.click(screen.getByTestId("projects-page_project-card_action-menu-button"));

            expect(
                screen.getByTestId("projects-page_project-card_action-menu_edit-project-button")
            ).toBeInTheDocument();
            expect(
                screen.getByTestId("projects-page_project-card_action-menu_delete-project-button")
            ).toBeInTheDocument();
        });

        it("calls onClickEditProject when the edit menu item is clicked", async () => {
            const { onClickEditProject, project, user } = setup({ role: USER_ROLES.OWNER });

            await user.click(screen.getByTestId("projects-page_project-card_action-menu-button"));
            await user.click(screen.getByTestId("projects-page_project-card_action-menu_edit-project-button"));

            expect(onClickEditProject).toHaveBeenCalledTimes(1);
            expect(onClickEditProject).toHaveBeenCalledWith(expect.anything(), project);
        });

        it("calls onClickDeleteProject when the delete menu item is clicked", async () => {
            const { onClickDeleteProject, project, user } = setup({ role: USER_ROLES.OWNER });

            await user.click(screen.getByTestId("projects-page_project-card_action-menu-button"));
            await user.click(screen.getByTestId("projects-page_project-card_action-menu_delete-project-button"));

            expect(onClickDeleteProject).toHaveBeenCalledTimes(1);
            expect(onClickDeleteProject).toHaveBeenCalledWith(expect.anything(), project);
        });
    });

    describe("description expander", () => {
        it("renders the description expander button", () => {
            setup();
            expect(screen.getByTestId("projects-page_project-card_description-expander")).toBeInTheDocument();
        });

        it("shows the ExpandMore icon (closed state) initially", () => {
            setup({ description: "Secret description" });
            // MUI Collapse uses CSS transitions — jsdom cannot compute CSS so
            // we verify the open/closed state via the icon the component renders.
            // ExpandMore = closed, ExpandLess = open.
            expect(screen.getByTestId("ExpandMoreIcon")).toBeInTheDocument();
            expect(screen.queryByTestId("ExpandLessIcon")).not.toBeInTheDocument();
        });

        it("shows the description text and ExpandLess icon after clicking the expander", async () => {
            const { user } = setup({ description: "My project description" });

            await user.click(screen.getByTestId("projects-page_project-card_description-expander"));

            expect(screen.getByTestId("ExpandLessIcon")).toBeInTheDocument();
            expect(screen.queryByTestId("ExpandMoreIcon")).not.toBeInTheDocument();
            expect(screen.getByText("My project description")).toBeInTheDocument();
        });

        it("shows the ExpandMore icon again when the expander is clicked a second time", async () => {
            const { user } = setup({ description: "Toggle me" });

            await user.click(screen.getByTestId("projects-page_project-card_description-expander"));
            await user.click(screen.getByTestId("projects-page_project-card_description-expander"));

            expect(screen.getByTestId("ExpandMoreIcon")).toBeInTheDocument();
            expect(screen.queryByTestId("ExpandLessIcon")).not.toBeInTheDocument();
        });
    });
});
