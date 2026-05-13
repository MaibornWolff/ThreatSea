import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HeaderProjectTabs } from "./header-project-tabs.component";
import type { ProjectTabs } from "../../application/hooks/use-project-tabs.hook";
import { renderWithProviders } from "../../test-utils/render-with-providers";

function buildProjectTabs(overrides: Partial<ProjectTabs> = {}): ProjectTabs {
    return {
        showProjectTabs: true,
        finalButtons: [
            { value: "/projects/1/system", text: "System" },
            { value: "/projects/1/threats", text: "Threats" },
        ],
        finalOnChangePath: vi.fn(),
        pathname: "/projects/1/system",
        ...overrides,
    };
}

describe("HeaderProjectTabs", () => {
    it("renders nothing when showProjectTabs is false", () => {
        renderWithProviders(<HeaderProjectTabs projectTabs={buildProjectTabs({ showProjectTabs: false })} />);
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("renders nothing when there is only one button (single-tab is handled by HeaderLevelOneNav)", () => {
        renderWithProviders(
            <HeaderProjectTabs
                projectTabs={buildProjectTabs({
                    finalButtons: [{ value: "/projects/1/system", text: "System" }],
                })}
            />
        );
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("renders a button for each tab when showProjectTabs is true and there are multiple tabs", () => {
        renderWithProviders(<HeaderProjectTabs projectTabs={buildProjectTabs()} />);
        expect(screen.getByText("System")).toBeInTheDocument();
        expect(screen.getByText("Threats")).toBeInTheDocument();
    });

    it("marks the active tab as selected", () => {
        renderWithProviders(<HeaderProjectTabs projectTabs={buildProjectTabs({ pathname: "/projects/1/threats" })} />);
        const threatsBtn = screen.getByText("Threats").closest("button");
        expect(threatsBtn).toHaveAttribute("aria-pressed", "true");
    });

    it("calls finalOnChangePath when a tab is clicked", async () => {
        const finalOnChangePath = vi.fn();
        renderWithProviders(<HeaderProjectTabs projectTabs={buildProjectTabs({ finalOnChangePath })} />);

        await userEvent.click(screen.getByText("Threats"));

        expect(finalOnChangePath).toHaveBeenCalledTimes(1);
        expect(finalOnChangePath).toHaveBeenCalledWith(expect.anything(), "/projects/1/threats");
    });
});
