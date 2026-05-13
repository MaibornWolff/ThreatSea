import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HeaderLevelOneNav } from "./header-level-one-nav.component";
import { renderWithProviders } from "../../test-utils/render-with-providers";
import type { ProjectTabs } from "../../application/hooks/use-project-tabs.hook";

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildProjectTabs(overrides: Partial<ProjectTabs> = {}): ProjectTabs {
    return {
        showProjectTabs: false,
        finalButtons: [],
        finalOnChangePath: vi.fn(),
        pathname: "/projects",
        ...overrides,
    };
}

/**
 * Renders HeaderLevelOneNav with the Redux store pre-loaded so that
 * `state.navigation.showUniversalHeaderNavigation` can be controlled.
 */
function setup(projectTabsOverrides: Partial<ProjectTabs> = {}, showUniversalHeaderNavigation = true) {
    const projectTabs = buildProjectTabs(projectTabsOverrides);
    renderWithProviders(<HeaderLevelOneNav projectTabs={projectTabs} />, {
        preloadedState: {
            navigation: { showUniversalHeaderNavigation } as never,
        },
    });
    return { projectTabs };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("HeaderLevelOneNav", () => {
    describe("universal navigation (showUniversalHeaderNavigation = true)", () => {
        it("renders the Projects and Catalogs navigation buttons", () => {
            setup();
            expect(screen.getByTestId("navigation-header_projects-page-button")).toBeInTheDocument();
            expect(screen.getByTestId("navigation-header_catalogs-page-button")).toBeInTheDocument();
        });

        it("marks the active route button as selected", () => {
            setup({ pathname: "/projects" });
            const projectsBtn = screen.getByTestId("navigation-header_projects-page-button");
            expect(projectsBtn).toHaveAttribute("aria-pressed", "true");
        });

        it("calls finalOnChangePath when a navigation button is clicked", async () => {
            const { projectTabs } = setup();

            await userEvent.click(screen.getByTestId("navigation-header_catalogs-page-button"));

            expect(projectTabs.finalOnChangePath).toHaveBeenCalledTimes(1);
            expect(projectTabs.finalOnChangePath).toHaveBeenCalledWith(expect.anything(), "/catalogs");
        });
    });

    describe("inline single-tab mode (showUniversalHeaderNavigation = false, one project tab)", () => {
        it("renders the single project tab inline", () => {
            setup(
                {
                    showProjectTabs: true,
                    finalButtons: [{ value: "/projects/1/system", text: "System" }],
                },
                false
            );
            expect(screen.getByText("System")).toBeInTheDocument();
        });

        it("does not render the universal Projects/Catalogs buttons", () => {
            setup(
                {
                    showProjectTabs: true,
                    finalButtons: [{ value: "/projects/1/system", text: "System" }],
                },
                false
            );
            expect(screen.queryByTestId("navigation-header_projects-page-button")).not.toBeInTheDocument();
        });
    });

    describe("hidden state", () => {
        it("renders nothing when showUniversalHeaderNavigation is false and there are no project tabs", () => {
            setup({}, false);
            expect(screen.queryByRole("button")).not.toBeInTheDocument();
        });

        it("renders nothing when showUniversalHeaderNavigation is false and showProjectTabs is false", () => {
            setup({ showProjectTabs: false, finalButtons: [] }, false);
            expect(screen.queryByRole("button")).not.toBeInTheDocument();
        });

        it("renders nothing when showUniversalHeaderNavigation is false and there are multiple project tabs (handled by HeaderProjectTabs)", () => {
            setup(
                {
                    showProjectTabs: true,
                    finalButtons: [
                        { value: "/projects/1/system", text: "System" },
                        { value: "/projects/1/threats", text: "Threats" },
                    ],
                },
                false
            );
            // Multiple tabs → inlineSingleTab is false → nothing rendered here
            expect(screen.queryByRole("button")).not.toBeInTheDocument();
        });
    });
});
