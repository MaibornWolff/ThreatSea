import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TFunction } from "i18next";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { THREAT_STATUSES } from "#api/types/threat-statuses.types.ts";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import type { GenericThreatWithExtendedThreats } from "#api/types/generic-threat.types.ts";
import type { ExtendedThreatWithMetrics } from "#application/hooks/use-generic-threats-list.hook.ts";
import { createThreatsColumns, formatComponentName, type ThreatsGridRow } from "./create-threats-columns";

const identityT = ((key: string) => key) as unknown as TFunction;

interface BuildOptions {
    columnFilters?: Record<string, string>;
    expandedFilters?: Record<string, boolean>;
    userRole?: USER_ROLES;
}

const buildColumns = (opts: BuildOptions = {}) => {
    const handlers = {
        onFilterChange: vi.fn(),
        onToggleFilterExpanded: vi.fn(),
        onToggleGenericThreat: vi.fn(),
        onAssetHover: vi.fn(),
        onAssetHoverEnd: vi.fn(),
        onAddThreat: vi.fn(),
        onEditThreat: vi.fn(),
        onDuplicateThreat: vi.fn(),
        onDeleteThreat: vi.fn(),
    };

    const columns = createThreatsColumns({
        t: identityT,
        userRole: opts.userRole ?? USER_ROLES.EDITOR,
        columnFilters: opts.columnFilters ?? {},
        expandedFilters: opts.expandedFilters ?? {},
        ...handlers,
    });

    return { columns, handlers };
};

const genericThreat = {
    id: 7,
    name: "Physical access",
    description: "desc",
    pointOfAttack: "DATA_STORAGE_INFRASTRUCTURE",
    attacker: "UNAUTHORISED_PARTIES",
    componentName: "Database",
    interfaceName: null,
    threats: [],
} as unknown as GenericThreatWithExtendedThreats;

const threat = {
    id: 42,
    genericThreatId: 7,
    name: "Refined access",
    description: "threat desc",
    pointOfAttack: "DATA_STORAGE_INFRASTRUCTURE",
    attacker: "UNAUTHORISED_PARTIES",
    probability: 4,
    status: THREAT_STATUSES.IN_PROGRESS,
    assets: [
        { id: 1, name: "Credentials", confidentiality: 5, integrity: 5, availability: 5 },
        { id: 2, name: "User ID", confidentiality: 2, integrity: 3, availability: 4 },
    ],
    componentName: "Database",
    interfaceName: null,
    damage: 5,
    risk: 20,
} as unknown as ExtendedThreatWithMetrics;

const genericRow: ThreatsGridRow = {
    rowType: "genericThreat",
    rowId: "generic-7",
    genericThreat,
    threatCount: 1,
    isExpanded: false,
};

const threatRow: ThreatsGridRow = { rowType: "threat", rowId: "threat-42", threat };

const noThreatsRow: ThreatsGridRow = { rowType: "noThreats", rowId: "empty-7" };

const cellParams = (row: ThreatsGridRow): GridRenderCellParams<ThreatsGridRow> =>
    ({ row }) as unknown as GridRenderCellParams<ThreatsGridRow>;

const renderCell = (column: GridColDef<ThreatsGridRow> | undefined, row: ThreatsGridRow) => {
    if (!column?.renderCell) {
        throw new Error("Column has no renderCell");
    }
    return renderWithProviders(<>{column.renderCell(cellParams(row))}</>);
};

const columnByField = (opts: BuildOptions = {}) => {
    const { columns, handlers } = buildColumns(opts);
    return { byField: Object.fromEntries(columns.map((c) => [c.field, c])), handlers };
};

describe("createThreatsColumns — structure", () => {
    it("renders all expected columns in order", () => {
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
            "status",
            "actions",
        ]);
    });

    it("disables sorting on every column (custom hierarchy ordering)", () => {
        const { columns } = buildColumns();
        expect(columns.every((c) => c.sortable === false)).toBe(true);
    });
});

describe("createThreatsColumns — generic threat rows carry no risk", () => {
    it.each(["probability", "damage", "risk", "assets", "status"])(
        "renders nothing (no misleading dash) for %s on a generic threat row",
        (field) => {
            const { byField } = columnByField();
            const { container } = renderCell(byField[field], genericRow);
            // Generic threats have no risk of their own; these cells stay empty rather than
            // showing "-", which would read as a missing value.
            expect(container).not.toHaveTextContent("-");
            expect(container.querySelector("svg")).not.toBeInTheDocument();
        }
    );

    it("shows the threat count and an add-threat button on the generic threat actions cell", async () => {
        const { byField, handlers } = columnByField();
        renderCell(byField["actions"], { ...genericRow, threatCount: 3 });
        expect(screen.getByText("threatsCount")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: "addThreat" }));
        expect(handlers.onAddThreat).toHaveBeenCalledTimes(1);
    });

    it("hides the add-threat button from viewers", () => {
        const { byField } = columnByField({ userRole: USER_ROLES.VIEWER });
        renderCell(byField["actions"], genericRow);
        expect(screen.queryByRole("button", { name: "addThreat" })).not.toBeInTheDocument();
    });
});

describe("createThreatsColumns — threat rows show metrics", () => {
    it("renders probability, damage and risk from the computed metrics", () => {
        const { byField } = columnByField();
        renderCell(byField["probability"], threatRow);
        expect(screen.getByText("4")).toBeInTheDocument();
        renderCell(byField["damage"], threatRow);
        expect(screen.getByText("5")).toBeInTheDocument();
        renderCell(byField["risk"], threatRow);
        expect(screen.getByText("20")).toBeInTheDocument();
    });

    it("renders the asset count and reports hover with the asset list", async () => {
        const { byField, handlers } = columnByField();
        renderCell(byField["assets"], threatRow);
        const count = screen.getByText("2");
        await userEvent.hover(count);
        expect(handlers.onAssetHover).toHaveBeenCalledTimes(1);
        expect(handlers.onAssetHover.mock.calls[0]?.[1]).toHaveLength(2);
    });

    it("translates the status via the statusList namespace", () => {
        const { byField } = columnByField();
        renderCell(byField["status"], threatRow);
        expect(screen.getByText("statusList.in progress")).toBeInTheDocument();
    });

    it.each([
        [THREAT_STATUSES.NEW, "statusList.new"],
        [THREAT_STATUSES.IN_PROGRESS, "statusList.in progress"],
        [THREAT_STATUSES.FINALIZED, "statusList.finalized"],
        [THREAT_STATUSES.OUTOFSCOPE, "statusList.out of scope"],
    ])("renders a status icon alongside the label for %s", (status, label) => {
        const { byField } = columnByField();
        const { container } = renderCell(byField["status"], {
            rowType: "threat",
            rowId: "threat-99",
            threat: { ...threat, status },
        });
        expect(screen.getByText(label)).toBeInTheDocument();
        expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("exposes edit, duplicate and delete actions to editors and wires them", async () => {
        const { byField, handlers } = columnByField();
        renderCell(byField["actions"], threatRow);

        await userEvent.click(screen.getByRole("button", { name: "editThreat" }));
        await userEvent.click(screen.getByRole("button", { name: "duplicateThreat" }));
        await userEvent.click(screen.getByRole("button", { name: "deleteThreat" }));

        expect(handlers.onEditThreat).toHaveBeenCalledTimes(1);
        expect(handlers.onDuplicateThreat).toHaveBeenCalledTimes(1);
        expect(handlers.onDeleteThreat).toHaveBeenCalledTimes(1);
    });

    it("hides threat actions from viewers", () => {
        const { byField } = columnByField({ userRole: USER_ROLES.VIEWER });
        renderCell(byField["actions"], threatRow);
        expect(screen.queryByRole("button", { name: "editThreat" })).not.toBeInTheDocument();
    });
});

describe("createThreatsColumns — expand toggle", () => {
    it("toggles the generic threat when its chevron is clicked", async () => {
        const { byField, handlers } = columnByField();
        renderCell(byField["name"], genericRow);
        await userEvent.click(screen.getByRole("button", { name: "expand" }));
        expect(handlers.onToggleGenericThreat).toHaveBeenCalledWith(7);
    });

    it("labels the chevron Collapse when the generic threat is expanded", () => {
        const { byField } = columnByField();
        renderCell(byField["name"], { ...genericRow, isExpanded: true });
        expect(screen.getByRole("button", { name: "collapse" })).toBeInTheDocument();
    });
});

describe("formatComponentName", () => {
    it("appends the interface name for communication interfaces", () => {
        expect(
            formatComponentName(
                {
                    pointOfAttack: POINTS_OF_ATTACK.COMMUNICATION_INTERFACES,
                    componentName: "Client",
                    interfaceName: "Test",
                },
                identityT
            )
        ).toBe("Client > Test");
    });

    it("falls back to the unknown label when the component name is missing", () => {
        expect(
            formatComponentName(
                {
                    pointOfAttack: POINTS_OF_ATTACK.COMMUNICATION_INTERFACES,
                    componentName: null,
                    interfaceName: "Test",
                },
                identityT
            )
        ).toBe("unknown > Test");
    });

    it("returns the plain component name for non-interface points of attack", () => {
        expect(
            formatComponentName(
                {
                    pointOfAttack: POINTS_OF_ATTACK.DATA_STORAGE_INFRASTRUCTURE,
                    componentName: "Database",
                    interfaceName: null,
                },
                identityT
            )
        ).toBe("Database");
    });
});

describe("createThreatsColumns — no threats placeholder", () => {
    it("spans the whole grid and shows the placeholder for a generic threat without threats", () => {
        const { byField } = columnByField();
        const nameColumn = byField["name"]!;
        const colSpan = nameColumn.colSpan as (value: unknown, row: ThreatsGridRow) => number | undefined;
        expect(colSpan(undefined, noThreatsRow)).toBe(10);
        expect(colSpan(undefined, threatRow)).toBeUndefined();

        renderCell(nameColumn, noThreatsRow);
        expect(screen.getByText("noThreats")).toBeInTheDocument();
    });
});
