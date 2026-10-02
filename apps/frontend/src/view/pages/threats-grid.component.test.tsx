import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { GridColDef } from "@mui/x-data-grid";
import type { GenericThreatWithExtendedThreats } from "#api/types/generic-threat.types.ts";
import { THREAT_STATUSES } from "#api/types/threat-statuses.types.ts";
import type { ExtendedThreatWithMetrics } from "#application/hooks/use-generic-threats-list.hook.ts";
import { createThreat } from "#test-utils/builders.ts";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
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

const setup = (gridRows: ThreatsGridRow[] = rows) => {
    const onToggleGenericThreat = vi.fn();
    const onEditThreat = vi.fn();
    renderWithProviders(
        <div style={{ height: 600, width: 800 }}>
            <ThreatsGrid
                rows={gridRows}
                columns={columns}
                loading={false}
                columnVisibilityModel={{}}
                onColumnWidthChange={vi.fn()}
                onToggleGenericThreat={onToggleGenericThreat}
                onEditThreat={onEditThreat}
            />
        </div>
    );
    return { onToggleGenericThreat, onEditThreat, user: userEvent.setup() };
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
        setup([]);

        expect(screen.getByText("No Threats found")).toBeInTheDocument();
    });
});
