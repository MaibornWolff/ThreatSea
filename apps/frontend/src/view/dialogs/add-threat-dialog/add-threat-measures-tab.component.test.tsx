import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { createProject, createThreatMeasure } from "#test-utils/builders.ts";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { AddThreatMeasuresTab, type AddThreatMeasuresTabProps } from "./add-threat-measures-tab.component";

type RenderOverrides = Partial<AddThreatMeasuresTabProps>;

const renderTab = (overrides: RenderOverrides = {}) => {
    const props = {
        active: true,
        threatMeasures: [],
        sortBy: "measureName",
        sortDirection: "asc" as const,
        project: createProject(),
        userRole: USER_ROLES.EDITOR,
        onChangeSearchValue: vi.fn(),
        onClickApplyMeasure: vi.fn(),
        onChangeSortBy: vi.fn(),
        onClickEditMeasure: vi.fn(),
        onClickDeleteMeasureThreat: vi.fn(),
        onClickEditMeasureImpact: vi.fn(),
        ...overrides,
    };
    const user = userEvent.setup();
    renderWithProviders(<AddThreatMeasuresTab {...props} />);
    return { props, user };
};

describe("AddThreatMeasuresTab", () => {
    it("renders the Apply Measure button for the EDITOR role", () => {
        renderTab({ userRole: USER_ROLES.EDITOR });

        expect(screen.getByRole("button", { name: /apply measure/i })).toBeInTheDocument();
    });

    it("hides the Apply Measure button for the VIEWER role", () => {
        renderTab({ userRole: USER_ROLES.VIEWER });

        expect(screen.queryByRole("button", { name: /apply measure/i })).not.toBeInTheDocument();
    });

    it("calls onClickApplyMeasure when the Apply Measure button is clicked", async () => {
        const { props, user } = renderTab({ userRole: USER_ROLES.EDITOR });

        await user.click(screen.getByRole("button", { name: /apply measure/i }));

        expect(props.onClickApplyMeasure).toHaveBeenCalledOnce();
    });

    it("calls onChangeSearchValue when the user types in the search field", async () => {
        const { props, user } = renderTab();

        await user.type(screen.getByRole("textbox"), "db");

        expect(props.onChangeSearchValue).toHaveBeenCalledWith(
            expect.objectContaining({ target: expect.objectContaining({ value: "db" }) })
        );
    });

    it("renders a row for each applied threat measure", () => {
        renderTab({
            threatMeasures: [
                createThreatMeasure({ measureImpactId: 1, measureName: "Encrypt traffic" }),
                createThreatMeasure({ measureImpactId: 2, measureName: "Rotate credentials" }),
            ],
        });

        expect(screen.getByText("Encrypt traffic")).toBeInTheDocument();
        expect(screen.getByText("Rotate credentials")).toBeInTheDocument();
    });
});
