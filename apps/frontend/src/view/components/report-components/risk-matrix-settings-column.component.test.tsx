import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";

// t returns the key so we can assert on the untranslated headings/labels directly.
vi.mock("react-i18next", () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

import { createReportMilestone } from "#test-utils/builders.ts";
import { RiskMatrixSettingsColumn } from "./risk-matrix-settings-column.component";

type RiskMatrixSettingsColumnProps = ComponentProps<typeof RiskMatrixSettingsColumn>;

const defaultProps: RiskMatrixSettingsColumnProps = {
    milestones: null,
    onChangeMilestone: vi.fn(),
    fromScheduledAt: null,
    tillScheduledAt: null,
    onChangeFromScheduledAt: vi.fn(),
    onChangeTillScheduledAt: vi.fn(),
};

const renderColumn = (props: Partial<RiskMatrixSettingsColumnProps> = {}) =>
    render(<RiskMatrixSettingsColumn {...defaultProps} {...props} />);

describe("RiskMatrixSettingsColumn", () => {
    it("renders the risk-matrix and scheduled-at headings", () => {
        renderColumn();
        expect(screen.getByText("riskMatrixSettings")).toBeInTheDocument();
        expect(screen.getByText("scheduledAt")).toBeInTheDocument();
    });

    it("renders one switch per milestone, labelled by its scheduled date", () => {
        const milestones = [
            createReportMilestone({ scheduledAt: "2025-01-01" }),
            createReportMilestone({ scheduledAt: "2025-06-15" }),
        ];
        renderColumn({ milestones });

        expect(screen.getByLabelText("2025-01-01")).toBeInTheDocument();
        expect(screen.getByLabelText("2025-06-15")).toBeInTheDocument();
    });

    it("reflects each milestone's active state", () => {
        const milestones = [
            createReportMilestone({ scheduledAt: "2025-01-01", active: true }),
            createReportMilestone({ scheduledAt: "2025-06-15", active: false }),
        ];
        renderColumn({ milestones });

        expect(screen.getByLabelText("2025-01-01")).toBeChecked();
        expect(screen.getByLabelText("2025-06-15")).not.toBeChecked();
    });

    it("calls onChangeMilestone with the milestone and its new checked value", async () => {
        const onChangeMilestone = vi.fn();
        const milestone = createReportMilestone({ scheduledAt: "2025-01-01", active: false });
        renderColumn({ milestones: [milestone], onChangeMilestone });

        await userEvent.click(screen.getByLabelText("2025-01-01"));

        expect(onChangeMilestone).toHaveBeenCalledTimes(1);
        expect(onChangeMilestone).toHaveBeenCalledWith(milestone, true);
    });

    it("renders no milestone switches when milestones is null", () => {
        renderColumn({ milestones: null });
        expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    });

    it("renders no milestone switches when milestones is empty", () => {
        renderColumn({ milestones: [] });
        expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    });

    it("shows the from/till date field values", () => {
        renderColumn({ fromScheduledAt: "2025-01-01", tillScheduledAt: "2025-12-31" });

        expect(screen.getByLabelText("fromScheduledAt")).toHaveValue("2025-01-01");
        expect(screen.getByLabelText("tillScheduledAt")).toHaveValue("2025-12-31");
    });

    it("calls onChangeFromScheduledAt when the from date changes", () => {
        const onChangeFromScheduledAt = vi.fn();
        renderColumn({ fromScheduledAt: "2025-01-01", onChangeFromScheduledAt });

        fireEvent.change(screen.getByLabelText("fromScheduledAt"), { target: { value: "2025-02-02" } });

        expect(onChangeFromScheduledAt).toHaveBeenCalledTimes(1);
    });

    it("calls onChangeTillScheduledAt when the till date changes", () => {
        const onChangeTillScheduledAt = vi.fn();
        renderColumn({ tillScheduledAt: "2025-12-31", onChangeTillScheduledAt });

        fireEvent.change(screen.getByLabelText("tillScheduledAt"), { target: { value: "2025-11-11" } });

        expect(onChangeTillScheduledAt).toHaveBeenCalledTimes(1);
    });
});
