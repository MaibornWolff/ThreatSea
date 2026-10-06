import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { GridColDef, GridSortModel } from "@mui/x-data-grid";
import type { GenericThreatWithExtendedThreats } from "#api/types/generic-threat.types.ts";
import { THREAT_STATUSES } from "#api/types/threat-statuses.types.ts";
import type { ExtendedThreatWithMetrics } from "#application/hooks/use-generic-threats-list.hook.ts";
import { createThreat } from "#test-utils/builders.ts";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { translationUtil } from "#utils/translations.ts";
import type { ThreatsGridRow } from "./create-threats-columns";
import { ThreatsGrid } from "./threats-grid.component";

// Minimal columns: the real cells are covered by create-threats-columns.test.tsx; here the
// grid's own behaviour (row test ids, toggling, editing, dimming) is under test.
const columns: GridColDef<ThreatsGridRow>[] = [
    {
        field: "name",
        headerName: "Name",
        renderCell: ({ row }) =>
            row.rowType === "genericThreat"
                ? row.genericThreat.name
                : row.rowType === "threat"
                  ? row.threat.name
                  : "No threats",
    },
    { field: "actions", headerName: "Actions", renderCell: () => "actions" },
];

const genericThreat = { id: 7, name: "Spoofing of identity" } as GenericThreatWithExtendedThreats;
const threat = (id: number, name: string, status = THREAT_STATUSES.IN_PROGRESS): ExtendedThreatWithMetrics => ({
    ...createThreat({ id, genericThreatId: 7, name, status }),
    damage: 1,
    risk: 3,
});

const loginBypass = threat(1, "Login bypass");

const rows: ThreatsGridRow[] = [
    {
        rowType: "genericThreat",
        rowId: "generic-7",
        genericThreat,
        threatCount: 2,
        totalThreatCount: 2,
        isExpanded: true,
    },
    { rowType: "threat", rowId: "threat-1", threat: loginBypass },
    { rowType: "threat", rowId: "threat-2", threat: threat(2, "Session hijack", THREAT_STATUSES.FINALIZED) },
];

const setup = (
    gridRows: ThreatsGridRow[] = rows,
    { pageSize = 25, genericThreatCount = 1 }: { pageSize?: number; genericThreatCount?: number } = {}
) => {
    const onToggleGenericThreat = vi.fn();
    const onEditThreat = vi.fn();
    const onSortModelChange = vi.fn();
    renderWithProviders(
        <div style={{ height: 600, width: 800 }}>
            <ThreatsGrid
                rows={gridRows}
                columns={columns}
                loading={false}
                columnVisibilityModel={{}}
                sortModel={[{ field: "name", sort: "asc" }]}
                onSortModelChange={onSortModelChange}
                paginationModel={{ page: 0, pageSize }}
                onPaginationModelChange={vi.fn()}
                genericThreatCount={genericThreatCount}
                onColumnWidthChange={vi.fn()}
                onToggleGenericThreat={onToggleGenericThreat}
                onEditThreat={onEditThreat}
            />
        </div>
    );
    return { onToggleGenericThreat, onEditThreat, onSortModelChange, user: userEvent.setup() };
};

const rowOf = (text: string) => screen.getByText(text).closest<HTMLElement>("[role='row']")!;

describe("ThreatsGrid", () => {
    it("tags generic threat and threat rows with the test ids the e2e page objects use", () => {
        setup();

        expect(rowOf("Spoofing of identity")).toHaveAttribute("data-testid", "threats-page_generic-threats-list-entry");
        expect(rowOf("Login bypass")).toHaveAttribute("data-testid", "threats-page_threats-list-entry");
    });

    it("toggles a generic threat when any of its cells is clicked", async () => {
        const { onToggleGenericThreat, user } = setup();

        await user.click(within(rowOf("Spoofing of identity")).getByText("actions"));

        expect(onToggleGenericThreat).toHaveBeenCalledWith(7);
    });

    it("opens a threat for editing when its row is clicked, but not from its actions cell", async () => {
        const { onEditThreat, user } = setup();

        await user.click(screen.getByText("Login bypass"));
        expect(onEditThreat).toHaveBeenCalledWith(expect.anything(), loginBypass);

        onEditThreat.mockClear();
        await user.click(within(rowOf("Login bypass")).getByText("actions"));
        expect(onEditThreat).not.toHaveBeenCalled();
    });

    it("toggles a generic threat with the keyboard", async () => {
        const { onToggleGenericThreat, user } = setup();

        await user.click(screen.getByText("Spoofing of identity"));
        onToggleGenericThreat.mockClear();
        await user.keyboard("{Enter}");

        expect(onToggleGenericThreat).toHaveBeenCalledWith(7);
    });

    it("dims finalized threats but not threats in progress", () => {
        setup();

        expect(rowOf("Session hijack")).toHaveClass("threats-grid--dimmed");
        expect(rowOf("Login bypass")).not.toHaveClass("threats-grid--dimmed");
    });

    it("says that no threats were found when there are no rows", () => {
        setup([], { genericThreatCount: 0 });

        expect(screen.getByText("No Threats found")).toBeInTheDocument();
    });

    it("shows every given row even beyond the page size, so a generic threat keeps its threats on the page", () => {
        // one generic threat with eleven threats on a page of ten: client-side paging would cut the last two rows
        const manyThreats = Array.from({ length: 11 }, (_, index) => threat(100 + index, `Threat ${index + 1}`));
        const groupRows: ThreatsGridRow[] = [
            {
                rowType: "genericThreat",
                rowId: "generic-7",
                genericThreat,
                threatCount: 11,
                totalThreatCount: 11,
                isExpanded: true,
            },
            ...manyThreats.map((item): ThreatsGridRow => ({
                rowType: "threat",
                rowId: `threat-${item.id}`,
                threat: item,
            })),
        ];
        setup(groupRows, { pageSize: 10, genericThreatCount: 12 });

        expect(rowOf("Threat 11")).toBeInTheDocument();
        // the footer counts generic threats, not rows
        expect(screen.getByText("Generic threats per page:")).toBeInTheDocument();
        expect(screen.getByText("1–10 of 12")).toBeInTheDocument();
    });

    it("hands sorting to the page when a column header is clicked", async () => {
        const { onSortModelChange, user } = setup();

        await user.click(screen.getByText("Name"));

        expect(onSortModelChange).toHaveBeenCalledWith([{ field: "name", sort: "desc" }], expect.anything());
    });

    it("keeps the theme's German DataGrid texts next to its own page-size label", async () => {
        await act(async () => {
            await translationUtil.changeLanguage("de");
        });
        try {
            setup(rows, { pageSize: 10, genericThreatCount: 12 });

            expect(screen.getByText("Generische Bedrohungen pro Seite:")).toBeInTheDocument();
            expect(screen.getByText("1–10 von 12")).toBeInTheDocument();
        } finally {
            await act(async () => {
                await translationUtil.changeLanguage("en");
            });
        }
    });

    it("moves back to the last remaining page when fewer generic threats are left", async () => {
        // e.g. editing the only matching threat under a filter drops its generic threat after the reload
        const onPaginationModelChange = vi.fn();
        // stable props, as on the page: a new sortModel array counts as a sort change and resets the page
        const sortModel: GridSortModel = [{ field: "name", sort: "asc" }];
        const paginationModel = { page: 1, pageSize: 10 };
        const grid = (genericThreatCount: number) => (
            <div style={{ height: 600, width: 800 }}>
                <ThreatsGrid
                    rows={rows}
                    columns={columns}
                    loading={false}
                    columnVisibilityModel={{}}
                    sortModel={sortModel}
                    onSortModelChange={vi.fn()}
                    paginationModel={paginationModel}
                    onPaginationModelChange={onPaginationModelChange}
                    genericThreatCount={genericThreatCount}
                    onColumnWidthChange={vi.fn()}
                    onToggleGenericThreat={vi.fn()}
                    onEditThreat={vi.fn()}
                />
            </div>
        );
        const { rerender } = renderWithProviders(grid(12));
        rerender(grid(12));
        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(onPaginationModelChange).not.toHaveBeenCalled();

        rerender(grid(5));

        await vi.waitFor(() =>
            expect(onPaginationModelChange).toHaveBeenLastCalledWith({ page: 0, pageSize: 10 }, expect.anything())
        );
    });

    it("returns to the first page when the sort order changes", async () => {
        const onPaginationModelChange = vi.fn();
        const paginationModel = { page: 1, pageSize: 10 };
        const grid = (sortModel: GridSortModel) => (
            <div style={{ height: 600, width: 800 }}>
                <ThreatsGrid
                    rows={rows}
                    columns={columns}
                    loading={false}
                    columnVisibilityModel={{}}
                    sortModel={sortModel}
                    onSortModelChange={vi.fn()}
                    paginationModel={paginationModel}
                    onPaginationModelChange={onPaginationModelChange}
                    genericThreatCount={12}
                    onColumnWidthChange={vi.fn()}
                    onToggleGenericThreat={vi.fn()}
                    onEditThreat={vi.fn()}
                />
            </div>
        );
        const ascending: GridSortModel = [{ field: "name", sort: "asc" }];
        const { rerender } = renderWithProviders(grid(ascending));
        rerender(grid(ascending));
        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(onPaginationModelChange).not.toHaveBeenCalled();

        rerender(grid([{ field: "risk", sort: "desc" }]));

        await vi.waitFor(() =>
            expect(onPaginationModelChange).toHaveBeenLastCalledWith({ page: 0, pageSize: 10 }, expect.anything())
        );
    });
});
