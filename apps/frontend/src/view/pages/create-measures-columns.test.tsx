import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TFunction } from "i18next";
import type { GridColDef } from "@mui/x-data-grid";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { createMeasure } from "#test-utils/builders.ts";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { createMeasuresColumns } from "./create-measures-columns";

const identityT = ((key: string) => key) as unknown as TFunction;

interface BuildOptions {
    columnFilters?: Record<string, string>;
    expandedFilters?: Record<string, boolean>;
    userRole?: USER_ROLES;
}

const buildColumns = (opts: BuildOptions = {}) => {
    const handleFilterChange = vi.fn();
    const toggleFilterExpanded = vi.fn();
    const handleDuplicateMeasure = vi.fn();
    const handleDeleteOrResetMeasure = vi.fn();

    const columns = createMeasuresColumns({
        t: identityT,
        userRole: opts.userRole ?? USER_ROLES.EDITOR,
        columnFilters: opts.columnFilters ?? {},
        handleFilterChange,
        expandedFilters: opts.expandedFilters ?? {},
        toggleFilterExpanded,
        handleDuplicateMeasure,
        handleDeleteOrResetMeasure,
    });

    return {
        columns,
        handlers: {
            handleFilterChange,
            toggleFilterExpanded,
            handleDuplicateMeasure,
            handleDeleteOrResetMeasure,
        },
    };
};

const renderColumnHeader = (column: GridColDef | undefined) => {
    if (!column?.renderHeader) {
        throw new Error("Column has no renderHeader");
    }
    return render(<>{column.renderHeader({} as never)}</>);
};

describe("createMeasuresColumns — column sizing (resize defaults)", () => {
    it("renders all expected columns in the documented order", () => {
        const { columns } = buildColumns();
        expect(columns.map((c) => c.field)).toEqual(["name", "scheduledAt", "actions"]);
    });

    it("data columns flex equally with sensible minWidths", () => {
        const { columns } = buildColumns();
        const byField = Object.fromEntries(columns.map((c) => [c.field, c]));

        for (const field of ["name", "scheduledAt"]) {
            expect(byField[field]!.flex, `${field} should flex`).toBe(1);
            expect(byField[field]!.minWidth).toBe(200);
        }
    });

    it("does not disable resizing on data columns (DataGrid default is resizable)", () => {
        const { columns } = buildColumns();
        for (const c of columns) {
            expect(c.resizable, `${c.field} should not opt out of resizing`).not.toBe(false);
        }
    });

    it("Actions column is wider (120) to fit duplicate + delete/reset", () => {
        const { columns } = buildColumns();
        const actions = columns.find((c) => c.field === "actions")!;
        expect(actions.width).toBe(120);
        expect(actions.sortable).toBe(false);
        expect(actions.filterable).toBe(false);
    });

    it("omits the actions column for non-editors", () => {
        const { columns } = buildColumns({ userRole: USER_ROLES.VIEWER });
        expect(columns.find((c) => c.field === "actions")).toBeUndefined();
    });
});

describe("createMeasuresColumns — filter header behavior", () => {
    it("renders the column label and the expand chevron", () => {
        const { columns } = buildColumns();
        renderColumnHeader(columns.find((c) => c.field === "name"));

        expect(screen.getByText("name")).toBeInTheDocument();
        expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("hides the filter input until expandedFilters[field] is true", () => {
        const { columns } = buildColumns({ expandedFilters: { name: false } });
        renderColumnHeader(columns.find((c) => c.field === "name"));

        expect(screen.getByPlaceholderText("filterPlaceholder")).not.toBeVisible();
    });

    it("shows the filter input when expandedFilters[field] is true", () => {
        const { columns } = buildColumns({ expandedFilters: { scheduledAt: true } });
        renderColumnHeader(columns.find((c) => c.field === "scheduledAt"));

        expect(screen.getByPlaceholderText("filterPlaceholder")).toBeVisible();
    });

    it("clicking the chevron toggles filter expansion with the column field", async () => {
        const { columns, handlers } = buildColumns();
        renderColumnHeader(columns.find((c) => c.field === "scheduledAt"));

        await userEvent.click(screen.getByRole("button"));

        expect(handlers.toggleFilterExpanded).toHaveBeenCalledWith("scheduledAt");
    });

    it("typing in the filter input calls handleFilterChange per keystroke with the field", async () => {
        const { columns, handlers } = buildColumns({ expandedFilters: { name: true } });
        renderColumnHeader(columns.find((c) => c.field === "name"));

        await userEvent.type(screen.getByPlaceholderText("filterPlaceholder"), "te");

        expect(handlers.handleFilterChange).toHaveBeenNthCalledWith(1, "name", "t");
        expect(handlers.handleFilterChange).toHaveBeenNthCalledWith(2, "name", "e");
    });
});

describe("createMeasuresColumns — scheduledAt valueGetter", () => {
    it("passes a date string through unchanged", () => {
        const { columns } = buildColumns();
        const col = columns.find((c) => c.field === "scheduledAt")!;
        const valueGetter = col.valueGetter as unknown as (value: string | null | undefined) => string;

        expect(valueGetter("2025-07-28")).toBe("2025-07-28");
    });

    it("falls back to the 'not scheduled yet' label for null/undefined/empty", () => {
        const { columns } = buildColumns();
        const col = columns.find((c) => c.field === "scheduledAt")!;
        const valueGetter = col.valueGetter as unknown as (value: string | null | undefined) => string;

        expect(valueGetter(null)).toBe("notScheduledYet");
        expect(valueGetter(undefined)).toBe("notScheduledYet");
        expect(valueGetter("")).toBe("notScheduledYet");
    });
});

describe("createMeasuresColumns — actions cell", () => {
    const renderActionsCell = (measureOverrides: Parameters<typeof createMeasure>[0]) => {
        const { columns, handlers } = buildColumns();
        const actions = columns.find((c) => c.field === "actions")!;
        const measure = createMeasure(measureOverrides);
        const onRowClick = vi.fn();
        renderWithProviders(<div onClick={onRowClick}>{actions.renderCell!({ row: measure } as never)}</div>);
        return { handlers, measure, onRowClick };
    };

    it("catalog measures get a reset action, disabled until scheduled", () => {
        renderActionsCell({ catalogMeasureId: 5, scheduledAt: "" });
        expect(screen.getByTestId("measures-page_measures-list-entry_reset-button")).toBeDisabled();
        expect(screen.queryByTestId("measures-page_measures-list-entry_delete-button")).not.toBeInTheDocument();
    });

    it("an enabled reset calls handleDeleteOrResetMeasure without bubbling to the row", async () => {
        const { handlers, measure, onRowClick } = renderActionsCell({
            catalogMeasureId: 5,
            scheduledAt: "2026-01-01",
        });
        await userEvent.click(screen.getByTestId("measures-page_measures-list-entry_reset-button"));
        expect(handlers.handleDeleteOrResetMeasure).toHaveBeenCalledWith(measure);
        expect(onRowClick).not.toHaveBeenCalled();
    });

    it("custom measures get a delete action instead of reset", async () => {
        const { handlers, measure } = renderActionsCell({ catalogMeasureId: null });
        expect(screen.queryByTestId("measures-page_measures-list-entry_reset-button")).not.toBeInTheDocument();
        await userEvent.click(screen.getByTestId("measures-page_measures-list-entry_delete-button"));
        expect(handlers.handleDeleteOrResetMeasure).toHaveBeenCalledWith(measure);
    });

    it("copy calls handleDuplicateMeasure without bubbling to the row", async () => {
        const { handlers, measure, onRowClick } = renderActionsCell({ catalogMeasureId: null });
        await userEvent.click(screen.getByTestId("measures-page_measures-list-entry_copy-button"));
        expect(handlers.handleDuplicateMeasure).toHaveBeenCalledWith(measure);
        expect(onRowClick).not.toHaveBeenCalled();
    });
});
