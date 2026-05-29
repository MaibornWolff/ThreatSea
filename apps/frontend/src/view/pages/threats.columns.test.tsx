import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TFunction } from "i18next";
import type { GridColDef } from "@mui/x-data-grid";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { createThreatsColumns } from "./threats.columns";

const identityT = ((key: string) => key) as unknown as TFunction;

interface BuildOptions {
    columnFilters?: Record<string, string>;
    expandedFilters?: Record<string, boolean>;
    userRole?: USER_ROLES;
}

const buildColumns = (opts: BuildOptions = {}) => {
    const handleFilterChange = vi.fn();
    const toggleFilterExpanded = vi.fn();
    const handleAssetHover = vi.fn();
    const setAssetAnchorEl = vi.fn();
    const handleDuplicateThreat = vi.fn();
    const handleDeleteThreat = vi.fn();

    const columns = createThreatsColumns({
        t: identityT,
        userRole: opts.userRole ?? USER_ROLES.EDITOR,
        columnFilters: opts.columnFilters ?? {},
        handleFilterChange,
        handleAssetHover,
        setAssetAnchorEl,
        handleDuplicateThreat,
        handleDeleteThreat,
        expandedFilters: opts.expandedFilters ?? {},
        toggleFilterExpanded,
    });

    return {
        columns,
        handlers: {
            handleFilterChange,
            toggleFilterExpanded,
            handleDuplicateThreat,
            handleDeleteThreat,
        },
    };
};

const renderColumnHeader = (column: GridColDef | undefined) => {
    if (!column?.renderHeader) {
        throw new Error("Column has no renderHeader");
    }
    return render(<>{column.renderHeader({} as never)}</>);
};

describe("createThreatsColumns — column sizing (resize defaults)", () => {
    it("renders all expected columns in the documented order", () => {
        const { columns } = buildColumns();
        expect(columns.map((c) => c.field)).toEqual([
            "name",
            "assets",
            "componentName",
            "pointOfAttack",
            "attacker",
            "probability",
            "damage",
            "risk",
            "doneEditing",
            "actions",
        ]);
    });

    it("gives the wider text columns flex sizing with a sensible minWidth", () => {
        const { columns } = buildColumns();
        const byField = Object.fromEntries(columns.map((c) => [c.field, c]));

        for (const field of ["name", "componentName", "pointOfAttack", "attacker"]) {
            const col = byField[field]!;
            expect(col.flex, `${field} should flex`).toBe(1);
            expect((col.minWidth ?? 0) >= 140, `${field} minWidth should be >= 140`).toBe(true);
        }
    });

    it("uses fixed widths for short-value columns", () => {
        const { columns } = buildColumns();
        const byField = Object.fromEntries(columns.map((c) => [c.field, c]));

        expect(byField["assets"]!.width).toBe(140);
        expect(byField["probability"]!.width).toBe(200);
        expect(byField["damage"]!.width).toBe(150);
        expect(byField["risk"]!.width).toBe(120);
    });

    it("keeps Probability wide enough that the filter chevron survives the DataGrid hover menu", () => {
        // The header renders the label + a chevron button. On hover, MUI overlays
        // its own column-menu icon on the right, eating ~30px. If the column is
        // too narrow, the chevron gets squished and the filter becomes unusable.
        const { columns } = buildColumns();
        const probability = columns.find((c) => c.field === "probability")!;
        expect(probability.width ?? 0).toBeGreaterThanOrEqual(180);
    });

    it("widens the Edited column to fit the dropdown filter", () => {
        const { columns } = buildColumns();
        const edited = columns.find((c) => c.field === "doneEditing")!;
        expect(edited.width).toBe(180);
    });

    it("does not disable resizing on data columns (DataGrid default is resizable)", () => {
        const { columns } = buildColumns();
        // `resizable: false` would opt the column out — assert nobody set it.
        for (const c of columns) {
            expect(c.resizable, `${c.field} should not opt out of resizing`).not.toBe(false);
        }
    });

    it("Edited column is sortable and filterable", () => {
        const { columns } = buildColumns();
        const edited = columns.find((c) => c.field === "doneEditing")!;
        expect(edited.sortable).not.toBe(false);
        expect(edited.filterable).not.toBe(false);
    });

    it("Actions column is not sortable or filterable", () => {
        const { columns } = buildColumns();
        const actions = columns.find((c) => c.field === "actions")!;
        expect(actions.sortable).toBe(false);
        expect(actions.filterable).toBe(false);
    });

    it("omits the actions column for non-editors", () => {
        const { columns } = buildColumns({ userRole: USER_ROLES.VIEWER });
        expect(columns.find((c) => c.field === "actions")).toBeUndefined();
    });
});

describe("createThreatsColumns — text-column filter header", () => {
    it("renders the column label and the expand chevron", () => {
        const { columns } = buildColumns();
        renderColumnHeader(columns.find((c) => c.field === "name"));

        expect(screen.getByText("name")).toBeInTheDocument();
        expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("hides the filter input until expandedFilters[field] is true", () => {
        const { columns } = buildColumns({ expandedFilters: { name: false } });
        renderColumnHeader(columns.find((c) => c.field === "name"));

        // Collapse keeps the DOM but with aria-hidden + zero height.
        const input = screen.getByPlaceholderText("Filter...");
        const collapseRoot = input.closest(".MuiCollapse-root");
        expect(collapseRoot).not.toBeNull();
        expect(collapseRoot!.classList.contains("MuiCollapse-hidden")).toBe(true);
    });

    it("shows the filter input when expandedFilters[field] is true", () => {
        const { columns } = buildColumns({ expandedFilters: { name: true } });
        renderColumnHeader(columns.find((c) => c.field === "name"));

        const input = screen.getByPlaceholderText("Filter...");
        const collapseRoot = input.closest(".MuiCollapse-root");
        expect(collapseRoot!.classList.contains("MuiCollapse-entered")).toBe(true);
    });

    it("clicking the chevron toggles filter expansion with the column field", async () => {
        const { columns, handlers } = buildColumns();
        renderColumnHeader(columns.find((c) => c.field === "name"));

        await userEvent.click(screen.getByRole("button"));

        expect(handlers.toggleFilterExpanded).toHaveBeenCalledTimes(1);
        expect(handlers.toggleFilterExpanded).toHaveBeenCalledWith("name");
    });

    it("typing in the filter input calls handleFilterChange per keystroke with the field", async () => {
        const { columns, handlers } = buildColumns({ expandedFilters: { pointOfAttack: true } });
        renderColumnHeader(columns.find((c) => c.field === "pointOfAttack"));

        await userEvent.type(screen.getByPlaceholderText("Filter..."), "abc");

        expect(handlers.handleFilterChange).toHaveBeenCalledTimes(3);
        for (const call of handlers.handleFilterChange.mock.calls) {
            expect(call[0]).toBe("pointOfAttack");
        }
        // Controlled input never updates here (we don't re-render with a new value),
        // so each event still carries a single-character string.
        expect(handlers.handleFilterChange).toHaveBeenNthCalledWith(1, "pointOfAttack", "a");
        expect(handlers.handleFilterChange).toHaveBeenNthCalledWith(2, "pointOfAttack", "b");
        expect(handlers.handleFilterChange).toHaveBeenNthCalledWith(3, "pointOfAttack", "c");
    });

    it("reflects the current filter value in the input", () => {
        const { columns } = buildColumns({
            columnFilters: { name: "auth" },
            expandedFilters: { name: true },
        });
        renderColumnHeader(columns.find((c) => c.field === "name"));

        expect(screen.getByPlaceholderText("Filter...")).toHaveValue("auth");
    });
});

describe("createThreatsColumns — Edited (doneEditing) dropdown filter", () => {
    it("renders a Select dropdown with All / Edited / Not Edited options", async () => {
        const { columns } = buildColumns({ expandedFilters: { doneEditing: true } });
        renderColumnHeader(columns.find((c) => c.field === "doneEditing"));

        // Open the MUI Select dropdown.
        await userEvent.click(screen.getByRole("combobox"));

        const listbox = await screen.findByRole("listbox");
        expect(within(listbox).getByRole("option", { name: "filterAll" })).toBeInTheDocument();
        expect(within(listbox).getByRole("option", { name: "edited" })).toBeInTheDocument();
        expect(within(listbox).getByRole("option", { name: "notEdited" })).toBeInTheDocument();
    });

    it("selecting an option calls handleFilterChange with the stable internal value", async () => {
        const { columns, handlers } = buildColumns({ expandedFilters: { doneEditing: true } });
        renderColumnHeader(columns.find((c) => c.field === "doneEditing"));

        await userEvent.click(screen.getByRole("combobox"));
        const listbox = await screen.findByRole("listbox");
        await userEvent.click(within(listbox).getByRole("option", { name: "edited" }));

        expect(handlers.handleFilterChange).toHaveBeenCalledWith("doneEditing", "edited");
    });

    it("uses a stable internal valueGetter (independent of locale)", () => {
        const { columns } = buildColumns();
        const edited = columns.find((c) => c.field === "doneEditing")!;
        expect(edited.valueGetter).toBeDefined();

        const valueGetter = edited.valueGetter as unknown as (value: unknown, row: { doneEditing: boolean }) => string;
        expect(valueGetter(undefined, { doneEditing: true })).toBe("edited");
        expect(valueGetter(undefined, { doneEditing: false })).toBe("notEdited");
    });
});
