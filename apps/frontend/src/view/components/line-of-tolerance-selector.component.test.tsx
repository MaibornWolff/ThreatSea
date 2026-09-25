import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { createProject } from "#test-utils/builders.ts";
import projectsReducer from "#application/reducers/projects.reducer.ts";
import { LineOfToleranceSelector } from "./line-of-tolerance-selector.component";

const preloadedWithRole = (role?: USER_ROLES) => ({
    projects: {
        ...projectsReducer(undefined, { type: "@@INIT" }),
        current: role ? createProject({ role }) : undefined,
    },
});

const setup = (role: USER_ROLES | undefined, props: Partial<ComponentProps<typeof LineOfToleranceSelector>> = {}) => {
    const onLoTChange = vi.fn();
    const onSave = vi.fn();
    const onReset = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
        <LineOfToleranceSelector
            title="Line of Tolerance"
            greenValue={3}
            redValue={6}
            isDirty={false}
            onLoTChange={onLoTChange}
            onSave={onSave}
            onReset={onReset}
            {...props}
        />,
        { preloadedState: preloadedWithRole(role) }
    );

    return { onLoTChange, onSave, onReset, user };
};

const expectSliderDisabled = (disabled: boolean) => {
    for (const thumb of screen.getAllByRole("slider")) {
        if (disabled) {
            expect(thumb).toBeDisabled();
        } else {
            expect(thumb).toBeEnabled();
        }
    }
};

describe("LineOfToleranceSelector — rendering & role gating", () => {
    it("renders the title", () => {
        setup(USER_ROLES.EDITOR);

        expect(screen.getByText("Line of Tolerance")).toBeInTheDocument();
    });

    it("enables the slider for an owner", () => {
        setup(USER_ROLES.OWNER);

        expectSliderDisabled(false);
    });

    it("enables the slider for an editor", () => {
        setup(USER_ROLES.EDITOR);

        expectSliderDisabled(false);
    });

    it("disables the slider for a viewer", () => {
        setup(USER_ROLES.VIEWER);

        expectSliderDisabled(true);
    });

    it("disables the slider when there is no current project role", () => {
        setup(undefined);

        expectSliderDisabled(true);
    });
});

describe("LineOfToleranceSelector — value conversion", () => {
    it("reports converted risk values when the green thumb is moved up one step", async () => {
        // greenValue 3 sits on slider index 3; one step right lands on index 4 → risk value 4.
        // redValue 6 stays on index 6 → risk value 6.
        const { onLoTChange, user } = setup(USER_ROLES.EDITOR);
        const [greenThumb] = screen.getAllByRole("slider");

        greenThumb!.focus();
        await user.keyboard("{ArrowRight}");

        expect(onLoTChange).toHaveBeenCalledWith([4, 6]);
    });
});

describe("LineOfToleranceSelector — save & reset", () => {
    const getSaveButton = () => screen.queryByRole("button", { name: "Save" });
    const getResetButton = () => screen.queryByRole("button", { name: "Reset" });

    it("hides save and reset for a viewer", () => {
        setup(USER_ROLES.VIEWER, { isDirty: true });

        expect(getSaveButton()).not.toBeInTheDocument();
        expect(getResetButton()).not.toBeInTheDocument();
    });

    it.each([USER_ROLES.EDITOR, USER_ROLES.OWNER])("disables save and reset for %s without changes", (role) => {
        setup(role, { isDirty: false });

        expect(getSaveButton()).toBeDisabled();
        expect(getResetButton()).toBeDisabled();
    });

    it("calls onSave when saving a change", async () => {
        const { onSave, onReset, user } = setup(USER_ROLES.EDITOR, { isDirty: true });

        await user.click(getSaveButton()!);

        expect(onSave).toHaveBeenCalledTimes(1);
        expect(onReset).not.toHaveBeenCalled();
    });

    it("calls onReset when resetting a change", async () => {
        const { onSave, onReset, user } = setup(USER_ROLES.EDITOR, { isDirty: true });

        await user.click(getResetButton()!);

        expect(onReset).toHaveBeenCalledTimes(1);
        expect(onSave).not.toHaveBeenCalled();
    });

    it("does not save when the slider moves", async () => {
        const { onSave, user } = setup(USER_ROLES.EDITOR);
        const [greenThumb] = screen.getAllByRole("slider");

        greenThumb!.focus();
        await user.keyboard("{ArrowRight}");

        expect(onSave).not.toHaveBeenCalled();
    });
});
