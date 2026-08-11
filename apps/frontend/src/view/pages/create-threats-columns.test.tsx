import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TFunction } from "i18next";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { THREAT_STATUSES } from "#api/types/threat-statuses.types.ts";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import type { GenericThreatWithExtendedChildren } from "#api/types/generic-threat.types.ts";
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
    children: [],
} as unknown as GenericThreatWithExtendedChildren;

const childThreat = {
    id: 42,
    genericThreatId: 7,
    name: "Refined access",
    description: "child desc",
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
    childCount: 1,
    isExpanded: false,
};

const threatRow: ThreatsGridRow = { rowType: "threat", rowId: "threat-42", threat: childThreat };

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

describe("createThreatsColumns — parent rows carry no risk", () => {
    it.each(["probability", "damage", "risk", "assets", "status"])(
        "renders a dash or empty for %s on a generic threat row",
        (field) => {
            const { byField } = columnByField();
            renderCell(byField[field], genericRow);
            // Parents never show a numeric risk metric; the risk-bearing fields render "-".
            if (["probability", "damage", "risk"].includes(field)) {
                expect(screen.getByText("-")).toBeInTheDocument();
            }
        }
    );

    it("shows the child count and an add-child button on the parent actions cell", async () => {
        const { byField, handlers } = columnByField();
        renderCell(byField["actions"], { ...genericRow, childCount: 3 });
        expect(screen.getByText("childThreatsCount")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: "addThreat" }));
        expect(handlers.onAddThreat).toHaveBeenCalledTimes(1);
    });

    it("hides the add-child button from viewers", () => {
        const { byField } = columnByField({ userRole: USER_ROLES.VIEWER });
        renderCell(byField["actions"], genericRow);
        expect(screen.queryByRole("button", { name: "addThreat" })).not.toBeInTheDocument();
    });
});

describe("createThreatsColumns — child rows show metrics", () => {
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
            threat: { ...childThreat, status },
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

    it("hides child actions from viewers", () => {
        const { byField } = columnByField({ userRole: USER_ROLES.VIEWER });
        renderCell(byField["actions"], threatRow);
        expect(screen.queryByRole("button", { name: "editThreat" })).not.toBeInTheDocument();
    });
});

describe("createThreatsColumns — expand toggle", () => {
    it("toggles the parent when its chevron is clicked", async () => {
        const { byField, handlers } = columnByField();
        renderCell(byField["name"], genericRow);
        await userEvent.click(screen.getByRole("button", { name: "Expand" }));
        expect(handlers.onToggleGenericThreat).toHaveBeenCalledWith(7);
    });

    it("labels the chevron Collapse when the parent is expanded", () => {
        const { byField } = columnByField();
        renderCell(byField["name"], { ...genericRow, isExpanded: true });
        expect(screen.getByRole("button", { name: "Collapse" })).toBeInTheDocument();
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
