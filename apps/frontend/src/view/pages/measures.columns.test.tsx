import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TFunction } from "i18next";
import type { GridColDef } from "@mui/x-data-grid";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { createMeasuresColumns } from "./measures.columns";

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
        tCommon: identityT,
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

        const collapseRoot = screen.getByPlaceholderText("Filter...").closest(".MuiCollapse-root");
        expect(collapseRoot!.classList.contains("MuiCollapse-hidden")).toBe(true);
    });

    it("shows the filter input when expandedFilters[field] is true", () => {
        const { columns } = buildColumns({ expandedFilters: { scheduledAt: true } });
        renderColumnHeader(columns.find((c) => c.field === "scheduledAt"));

        const collapseRoot = screen.getByPlaceholderText("Filter...").closest(".MuiCollapse-root");
        expect(collapseRoot!.classList.contains("MuiCollapse-entered")).toBe(true);
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

        await userEvent.type(screen.getByPlaceholderText("Filter..."), "te");

        expect(handlers.handleFilterChange).toHaveBeenNthCalledWith(1, "name", "t");
        expect(handlers.handleFilterChange).toHaveBeenNthCalledWith(2, "name", "e");
    });
});

describe("createMeasuresColumns — scheduledAt valueGetter", () => {
    it("formats a real Date to YYYY-MM-DD", () => {
        const { columns } = buildColumns();
        const col = columns.find((c) => c.field === "scheduledAt")!;
        const valueGetter = col.valueGetter as unknown as (value: Date | null | undefined) => string;

        expect(valueGetter(new Date("2025-07-28T00:00:00Z"))).toBe("2025-07-28");
    });

    it("falls back to the 'not scheduled yet' label for null/undefined", () => {
        const { columns } = buildColumns();
        const col = columns.find((c) => c.field === "scheduledAt")!;
        const valueGetter = col.valueGetter as unknown as (value: Date | null | undefined) => string;

        expect(valueGetter(null)).toBe("notScheduledYet");
        expect(valueGetter(undefined)).toBe("notScheduledYet");
    });
});
