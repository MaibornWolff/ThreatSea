import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TFunction } from "i18next";
import type { GridColDef } from "@mui/x-data-grid";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { createMembersColumns } from "./members.columns";

const identityT = ((key: string) => key) as unknown as TFunction;

interface BuildOptions {
    columnFilters?: Record<string, string>;
    expandedFilters?: Record<string, boolean>;
    userRole?: USER_ROLES;
}

const buildColumns = (opts: BuildOptions = {}) => {
    const handleFilterChange = vi.fn();
    const toggleFilterExpanded = vi.fn();
    const handleDeleteMember = vi.fn();

    const columns = createMembersColumns({
        t: identityT,
        tCommon: identityT,
        userRole: opts.userRole ?? USER_ROLES.OWNER,
        columnFilters: opts.columnFilters ?? {},
        handleFilterChange,
        expandedFilters: opts.expandedFilters ?? {},
        toggleFilterExpanded,
        handleDeleteMember,
    });

    return {
        columns,
        handlers: { handleFilterChange, toggleFilterExpanded, handleDeleteMember },
    };
};

const renderColumnHeader = (column: GridColDef | undefined) => {
    if (!column?.renderHeader) {
        throw new Error("Column has no renderHeader");
    }
    return render(<>{column.renderHeader({} as never)}</>);
};

describe("createMembersColumns — column sizing (resize defaults)", () => {
    it("renders all expected columns in the documented order", () => {
        const { columns } = buildColumns();
        expect(columns.map((c) => c.field)).toEqual(["name", "email", "role", "actions"]);
    });

    it("name and email columns flex with sensible minWidths", () => {
        const { columns } = buildColumns();
        const byField = Object.fromEntries(columns.map((c) => [c.field, c]));

        expect(byField["name"]!.flex).toBe(1);
        expect(byField["name"]!.minWidth).toBe(200);
        expect(byField["email"]!.flex).toBe(1);
        expect(byField["email"]!.minWidth).toBe(220);
    });

    it("role column is fixed-width (180) to fit translated role names", () => {
        const { columns } = buildColumns();
        const role = columns.find((c) => c.field === "role")!;
        expect(role.width).toBe(180);
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

    it("omits the actions column for non-owners (members deletes are owner-only)", () => {
        const { columns } = buildColumns({ userRole: USER_ROLES.EDITOR });
        expect(columns.find((c) => c.field === "actions")).toBeUndefined();
    });
});

describe("createMembersColumns — filter header behavior", () => {
    it("renders the column label and the expand chevron", () => {
        const { columns } = buildColumns();
        renderColumnHeader(columns.find((c) => c.field === "name"));

        expect(screen.getByText("name")).toBeInTheDocument();
        expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("hides the filter input until expandedFilters[field] is true", () => {
        const { columns } = buildColumns({ expandedFilters: { email: false } });
        renderColumnHeader(columns.find((c) => c.field === "email"));

        const collapseRoot = screen.getByPlaceholderText("Filter...").closest(".MuiCollapse-root");
        expect(collapseRoot!.classList.contains("MuiCollapse-hidden")).toBe(true);
    });

    it("shows the filter input when expandedFilters[field] is true", () => {
        const { columns } = buildColumns({ expandedFilters: { email: true } });
        renderColumnHeader(columns.find((c) => c.field === "email"));

        const collapseRoot = screen.getByPlaceholderText("Filter...").closest(".MuiCollapse-root");
        expect(collapseRoot!.classList.contains("MuiCollapse-entered")).toBe(true);
    });

    it("clicking the chevron toggles filter expansion with the column field", async () => {
        const { columns, handlers } = buildColumns();
        renderColumnHeader(columns.find((c) => c.field === "role"));

        await userEvent.click(screen.getByRole("button"));

        expect(handlers.toggleFilterExpanded).toHaveBeenCalledWith("role");
    });

    it("typing in the filter input calls handleFilterChange per keystroke with the field", async () => {
        const { columns, handlers } = buildColumns({ expandedFilters: { email: true } });
        renderColumnHeader(columns.find((c) => c.field === "email"));

        await userEvent.type(screen.getByPlaceholderText("Filter..."), "ab");

        expect(handlers.handleFilterChange).toHaveBeenNthCalledWith(1, "email", "a");
        expect(handlers.handleFilterChange).toHaveBeenNthCalledWith(2, "email", "b");
    });
});

describe("createMembersColumns — role valueGetter", () => {
    it("translates the role enum via t('userRoles.<ROLE>')", () => {
        const { columns } = buildColumns();
        const col = columns.find((c) => c.field === "role")!;
        const valueGetter = col.valueGetter as unknown as (value: USER_ROLES) => string;

        // identityT returns the lookup key untouched, so this asserts the format only.
        expect(valueGetter(USER_ROLES.OWNER)).toBe(`userRoles.${USER_ROLES.OWNER}`);
        expect(valueGetter(USER_ROLES.EDITOR)).toBe(`userRoles.${USER_ROLES.EDITOR}`);
        expect(valueGetter(USER_ROLES.VIEWER)).toBe(`userRoles.${USER_ROLES.VIEWER}`);
    });
});
