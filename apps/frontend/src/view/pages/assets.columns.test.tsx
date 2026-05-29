import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TFunction } from "i18next";
import type { GridColDef } from "@mui/x-data-grid";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { createAssetsColumns } from "./assets.columns";

const identityT = ((key: string) => key) as unknown as TFunction;

interface BuildOptions {
    columnFilters?: Record<string, string>;
    expandedFilters?: Record<string, boolean>;
    userRole?: USER_ROLES;
}

const buildColumns = (opts: BuildOptions = {}) => {
    const handleFilterChange = vi.fn();
    const toggleFilterExpanded = vi.fn();
    const handleDeleteAsset = vi.fn();

    const columns = createAssetsColumns({
        t: identityT,
        userRole: opts.userRole ?? USER_ROLES.EDITOR,
        columnFilters: opts.columnFilters ?? {},
        handleFilterChange,
        expandedFilters: opts.expandedFilters ?? {},
        toggleFilterExpanded,
        handleDeleteAsset,
    });

    return {
        columns,
        handlers: { handleFilterChange, toggleFilterExpanded, handleDeleteAsset },
    };
};

const renderColumnHeader = (column: GridColDef | undefined) => {
    if (!column?.renderHeader) {
        throw new Error("Column has no renderHeader");
    }
    return render(<>{column.renderHeader({} as never)}</>);
};

describe("createAssetsColumns — column sizing (resize defaults)", () => {
    it("renders all expected columns in the documented order", () => {
        const { columns } = buildColumns();
        expect(columns.map((c) => c.field)).toEqual([
            "name",
            "confidentiality",
            "integrity",
            "availability",
            "createdAt",
            "actions",
        ]);
    });

    it("all data columns flex equally with sensible minWidths", () => {
        const { columns } = buildColumns();
        const byField = Object.fromEntries(columns.map((c) => [c.field, c]));

        const expectedMinWidths: Record<string, number> = {
            name: 200,
            confidentiality: 160,
            integrity: 160,
            availability: 160,
            createdAt: 180,
        };
        for (const [field, minWidth] of Object.entries(expectedMinWidths)) {
            expect(byField[field]!.flex, `${field} should flex`).toBe(1);
            expect(byField[field]!.minWidth).toBe(minWidth);
        }
    });

    it("does not disable resizing on data columns (DataGrid default is resizable)", () => {
        const { columns } = buildColumns();
        for (const c of columns) {
            expect(c.resizable, `${c.field} should not opt out of resizing`).not.toBe(false);
        }
    });

    it("Actions column has fixed width and is not sortable or filterable", () => {
        const { columns } = buildColumns();
        const actions = columns.find((c) => c.field === "actions")!;
        expect(actions.width).toBe(80);
        expect(actions.sortable).toBe(false);
        expect(actions.filterable).toBe(false);
    });

    it("omits the actions column for non-editors", () => {
        const { columns } = buildColumns({ userRole: USER_ROLES.VIEWER });
        expect(columns.find((c) => c.field === "actions")).toBeUndefined();
    });
});

describe("createAssetsColumns — filter header behavior", () => {
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
        const { columns } = buildColumns({ expandedFilters: { confidentiality: true } });
        renderColumnHeader(columns.find((c) => c.field === "confidentiality"));

        const collapseRoot = screen.getByPlaceholderText("Filter...").closest(".MuiCollapse-root");
        expect(collapseRoot!.classList.contains("MuiCollapse-entered")).toBe(true);
    });

    it("clicking the chevron toggles filter expansion with the column field", async () => {
        const { columns, handlers } = buildColumns();
        renderColumnHeader(columns.find((c) => c.field === "integrity"));

        await userEvent.click(screen.getByRole("button"));

        expect(handlers.toggleFilterExpanded).toHaveBeenCalledTimes(1);
        expect(handlers.toggleFilterExpanded).toHaveBeenCalledWith("integrity");
    });

    it("typing in the filter input calls handleFilterChange per keystroke with the field", async () => {
        const { columns, handlers } = buildColumns({ expandedFilters: { availability: true } });
        renderColumnHeader(columns.find((c) => c.field === "availability"));

        await userEvent.type(screen.getByPlaceholderText("Filter..."), "ab");

        expect(handlers.handleFilterChange).toHaveBeenNthCalledWith(1, "availability", "a");
        expect(handlers.handleFilterChange).toHaveBeenNthCalledWith(2, "availability", "b");
    });

    it("reflects the current filter value in the input", () => {
        const { columns } = buildColumns({
            columnFilters: { name: "user-id" },
            expandedFilters: { name: true },
        });
        renderColumnHeader(columns.find((c) => c.field === "name"));

        expect(screen.getByPlaceholderText("Filter...")).toHaveValue("user-id");
    });
});

describe("createAssetsColumns — createdAt valueGetter", () => {
    it("formats Date values to YYYY-MM-DD for stable sorting/filtering", () => {
        const { columns } = buildColumns();
        const col = columns.find((c) => c.field === "createdAt")!;
        const valueGetter = col.valueGetter as unknown as (value: Date | string) => string;

        expect(valueGetter(new Date("2025-04-08T13:52:30Z"))).toBe("2025-04-08");
        expect(valueGetter("2023-11-27T12:14:16Z")).toBe("2023-11-27");
    });
});
