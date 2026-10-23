import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import type { TFunction } from "i18next";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { translationUtil } from "#utils/translations.ts";
import { THREAT_STATUSES } from "#api/types/threat-statuses.types.ts";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import type { GenericThreatWithExtendedThreats } from "#api/types/generic-threat.types.ts";
import type { ExtendedThreatWithMetrics } from "#application/hooks/use-generic-threats-list.hook.ts";
import { createThreatsColumns, formatComponentName, type ThreatsGridRow } from "./create-threats-columns";

// The app's real translations, fixed to English: the tests assert the texts users see, so a
// missing or misspelled key fails instead of passing as its own name.
const englishT = translationUtil.getFixedT("en", "threatsPage");
const germanT = translationUtil.getFixedT("de", "threatsPage");

interface BuildOptions {
    t?: TFunction;
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
        t: opts.t ?? englishT,
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
    confidentiality: true,
    integrity: false,
    availability: true,
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
    totalThreatCount: 1,
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

const renderHeader = (column: GridColDef<ThreatsGridRow> | undefined) => {
    if (!column?.renderHeader) {
        throw new Error("Column has no renderHeader");
    }
    return renderWithProviders(<>{column.renderHeader({} as never)}</>);
};

const columnByField = (opts: BuildOptions = {}) => {
    const { columns, handlers } = buildColumns(opts);
    return { byField: Object.fromEntries(columns.map((column) => [column.field, column])), handlers };
};

describe("createThreatsColumns — structure", () => {
    it("renders all expected columns in order", () => {
        const { columns } = buildColumns();
        expect(columns.map((c) => c.field)).toEqual([
            "name",
            "description",
            "assets",
            "protectionGoals",
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

    it("makes every column with values sortable, but not the actions column", () => {
        const { columns } = buildColumns();
        expect(columns.filter((column) => column.sortable !== false).map((column) => column.field)).toEqual([
            "name",
            "description",
            "assets",
            "componentName",
            "pointOfAttack",
            "attacker",
            "probability",
            "damage",
            "risk",
            "status",
        ]);
    });
});

describe("createThreatsColumns — numeric column headers", () => {
    it.each([
        { field: "probability", language: "English", t: englishT, abbreviation: "P", fullName: "Probability" },
        { field: "damage", language: "English", t: englishT, abbreviation: "D", fullName: "Damage" },
        { field: "risk", language: "English", t: englishT, abbreviation: "R", fullName: "Risk" },
        {
            field: "probability",
            language: "German",
            t: germanT,
            abbreviation: "EW",
            fullName: "Eintrittswahrscheinlichkeit",
        },
        { field: "damage", language: "German", t: germanT, abbreviation: "S", fullName: "Schaden" },
        { field: "risk", language: "German", t: germanT, abbreviation: "R", fullName: "Risiko" },
    ])(
        "abbreviates the $field header in $language and shows its full name on hover",
        async ({ field, t, abbreviation, fullName }) => {
            const { byField } = columnByField({ t });
            renderHeader(byField[field]);

            await userEvent.hover(screen.getByText(abbreviation));

            expect(await screen.findByRole("tooltip")).toHaveTextContent(fullName);
        }
    );

    it("keeps the full names for the column menu and the column selection", () => {
        const { byField } = columnByField();

        expect(byField["probability"]!.headerName).toBe("Probability");
        expect(byField["damage"]!.headerName).toBe("Damage");
        expect(byField["risk"]!.headerName).toBe("Risk");
    });
});

describe("createThreatsColumns — generic threat rows carry no risk", () => {
    it.each(["probability", "damage", "risk", "assets", "protectionGoals", "status"])(
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
        renderCell(byField["actions"], { ...genericRow, threatCount: 3, totalThreatCount: 3 });
        expect(screen.getByText("3 threats")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: "Add Threat" }));
        expect(handlers.onAddThreat).toHaveBeenCalledTimes(1);
    });

    it("shows how many of the generic threat's threats match while filters hide some", () => {
        const { byField } = columnByField();
        renderCell(byField["actions"], { ...genericRow, threatCount: 1, totalThreatCount: 3 });
        expect(screen.getByText("1 of 3 threats")).toBeInTheDocument();
    });

    it("hides the add-threat button from viewers", () => {
        const { byField } = columnByField({ userRole: USER_ROLES.VIEWER });
        renderCell(byField["actions"], genericRow);
        expect(screen.queryByRole("button", { name: "Add Threat" })).not.toBeInTheDocument();
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

    it("shows the translated status", () => {
        const { byField } = columnByField();
        renderCell(byField["status"], threatRow);
        expect(screen.getByText("In progress")).toBeInTheDocument();
    });

    it.each([
        [THREAT_STATUSES.NEW, "New"],
        [THREAT_STATUSES.IN_PROGRESS, "In progress"],
        [THREAT_STATUSES.FINALIZED, "Finalized"],
        [THREAT_STATUSES.OUTOFSCOPE, "Out of scope"],
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

        await userEvent.click(screen.getByRole("button", { name: "Edit Threat" }));
        await userEvent.click(screen.getByRole("button", { name: "Duplicate Threat" }));
        await userEvent.click(screen.getByRole("button", { name: "Delete Threat" }));

        expect(handlers.onEditThreat).toHaveBeenCalledTimes(1);
        expect(handlers.onDuplicateThreat).toHaveBeenCalledTimes(1);
        expect(handlers.onDeleteThreat).toHaveBeenCalledTimes(1);
    });

    it("hides threat actions from viewers", () => {
        const { byField } = columnByField({ userRole: USER_ROLES.VIEWER });
        renderCell(byField["actions"], threatRow);
        expect(screen.queryByRole("button", { name: "Edit Threat" })).not.toBeInTheDocument();
    });
});

describe("createThreatsColumns — expand toggle", () => {
    it("toggles the generic threat when its chevron is clicked", async () => {
        const { byField, handlers } = columnByField();
        renderCell(byField["name"], genericRow);
        await userEvent.click(screen.getByRole("button", { name: "Expand" }));
        expect(handlers.onToggleGenericThreat).toHaveBeenCalledWith(7);
    });

    it("labels the chevron Collapse when the generic threat is expanded", () => {
        const { byField } = columnByField();
        renderCell(byField["name"], { ...genericRow, isExpanded: true });
        expect(screen.getByRole("button", { name: "Collapse" })).toBeInTheDocument();
    });
});

describe("createThreatsColumns — protection goals column", () => {
    const threatRowWithGoals = (goals: { confidentiality: boolean; integrity: boolean; availability: boolean }) =>
        ({ rowType: "threat", rowId: "threat-42", threat: { ...threat, ...goals } }) as ThreatsGridRow;

    it.each([
        { language: "English", t: englishT, abbreviations: ["C", "I", "A"] },
        { language: "German", t: germanT, abbreviations: ["Vt", "In", "Vf"] },
    ])("shows all three protection goal abbreviations in $language", ({ t, abbreviations }) => {
        const { byField } = columnByField({ t });
        renderCell(byField["protectionGoals"], threatRow);

        for (const abbreviation of abbreviations) {
            expect(screen.getByText(abbreviation)).toBeInTheDocument();
        }
    });

    it("highlights the selected protection goals and greys out the others", () => {
        const { byField } = columnByField();
        renderCell(byField["protectionGoals"], threatRow);

        expect(screen.getByText("C")).toHaveStyle({ fontWeight: "700" });
        expect(screen.getByText("I")).not.toHaveStyle({ fontWeight: "700" });
        expect(screen.getByText("A")).toHaveStyle({ fontWeight: "700" });
    });

    it.each([
        {
            goals: { confidentiality: true, integrity: false, availability: true },
            name: "Confidentiality, Availability",
        },
        {
            goals: { confidentiality: true, integrity: true, availability: true },
            name: "Confidentiality, Integrity, Availability",
        },
        { goals: { confidentiality: false, integrity: true, availability: false }, name: "Integrity" },
        { goals: { confidentiality: false, integrity: false, availability: false }, name: "No protection goals" },
    ])("names the selected protection goals for assistive technology: $name", ({ goals, name }) => {
        const { byField } = columnByField();
        renderCell(byField["protectionGoals"], threatRowWithGoals(goals));

        expect(screen.getByRole("img", { name })).toBeInTheDocument();
    });

    it("abbreviates the header in English and shows its full name on hover", async () => {
        const { byField } = columnByField();
        renderHeader(byField["protectionGoals"]);

        await userEvent.hover(screen.getByText("CIA"));

        expect(await screen.findByRole("tooltip")).toHaveTextContent("Protection Goals");
    });

    it("writes out the short German header without a tooltip", async () => {
        const { byField } = columnByField({ t: germanT });
        renderHeader(byField["protectionGoals"]);

        await userEvent.hover(screen.getByText("Schutzziele"));

        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("keeps the full name for the column menu and cannot be sorted", () => {
        const { byField } = columnByField();
        const column = byField["protectionGoals"]!;

        expect(column.headerName).toBe("Protection Goals");
        expect(column.sortable).toBe(false);
    });

    it.each([
        { current: "", clicked: "Integrity", expected: "integrity" },
        { current: "availability", clicked: "Confidentiality", expected: "confidentiality,availability" },
        { current: "confidentiality,integrity", clicked: "Confidentiality", expected: "integrity" },
        { current: "integrity", clicked: "Integrity", expected: "" },
    ])(
        "ticking $clicked with the filter at '$current' filters for '$expected'",
        async ({ current, clicked, expected }) => {
            const { byField, handlers } = columnByField({
                columnFilters: { protectionGoals: current },
                expandedFilters: { protectionGoals: true },
            });
            renderHeader(byField["protectionGoals"]);

            await userEvent.click(screen.getByRole("combobox"));
            await userEvent.click(await screen.findByRole("option", { name: clicked }));

            expect(handlers.onFilterChange).toHaveBeenCalledWith("protectionGoals", expected);
        }
    );

    it("ticks the selected protection goals in the menu", async () => {
        const { byField } = columnByField({
            columnFilters: { protectionGoals: "confidentiality,availability" },
            expandedFilters: { protectionGoals: true },
        });
        renderHeader(byField["protectionGoals"]);

        await userEvent.click(screen.getByRole("combobox"));

        const checkboxOf = async (name: string) =>
            within(await screen.findByRole("option", { name })).getByRole("checkbox");
        expect(await checkboxOf("Confidentiality")).toBeChecked();
        expect(await checkboxOf("Integrity")).not.toBeChecked();
        expect(await checkboxOf("Availability")).toBeChecked();
    });

    it.each([
        { language: "English", t: englishT, filter: "", shown: "All" },
        { language: "English", t: englishT, filter: "confidentiality,availability", shown: "C, A" },
        { language: "German", t: germanT, filter: "", shown: "Alle" },
        { language: "German", t: germanT, filter: "integrity,availability", shown: "In, Vf" },
    ])("shows the filter '$filter' as '$shown' in $language", ({ t, filter, shown }) => {
        const { byField } = columnByField({
            t,
            columnFilters: { protectionGoals: filter },
            expandedFilters: { protectionGoals: true },
        });
        renderHeader(byField["protectionGoals"]);

        expect(screen.getByRole("combobox")).toHaveTextContent(shown);
    });
});

describe("createThreatsColumns — point of attack and attacker filters", () => {
    it.each([
        {
            field: "pointOfAttack",
            options: [
                "User Interface",
                "Processing Infrastructure",
                "Data Storage Infrastructure",
                "Communication Infrastructure",
                "Communication Interfaces",
                "User Behaviour",
            ],
        },
        {
            field: "attacker",
            options: ["Unauthorised Parties", "System Users", "Application Users", "Administrators"],
        },
    ])("offers every $field to tick", async ({ field, options }) => {
        const { byField } = columnByField({ expandedFilters: { [field]: true } });
        renderHeader(byField[field]);

        await userEvent.click(screen.getByRole("combobox"));

        const optionNames = (await screen.findAllByRole("option")).map((option) => option.textContent);
        expect(optionNames).toEqual(options);
    });

    it.each([
        { field: "pointOfAttack", current: "", clicked: "User Behaviour", expected: "USER_BEHAVIOUR" },
        {
            field: "pointOfAttack",
            current: "COMMUNICATION_INTERFACES",
            clicked: "User Interface",
            expected: "USER_INTERFACE,COMMUNICATION_INTERFACES",
        },
        { field: "attacker", current: "", clicked: "Administrators", expected: "ADMINISTRATORS" },
        { field: "attacker", current: "SYSTEM_USERS", clicked: "System Users", expected: "" },
    ])(
        "ticking $clicked with the $field filter at '$current' filters for '$expected'",
        async ({ field, current, clicked, expected }) => {
            const { byField, handlers } = columnByField({
                columnFilters: { [field]: current },
                expandedFilters: { [field]: true },
            });
            renderHeader(byField[field]);

            await userEvent.click(screen.getByRole("combobox"));
            await userEvent.click(await screen.findByRole("option", { name: clicked }));

            expect(handlers.onFilterChange).toHaveBeenCalledWith(field, expected);
        }
    );

    it("filters for the same value in German", async () => {
        const { byField, handlers } = columnByField({ t: germanT, expandedFilters: { attacker: true } });
        renderHeader(byField["attacker"]);

        await userEvent.click(screen.getByRole("combobox"));
        await userEvent.click(await screen.findByRole("option", { name: germanT("attackerList.ADMINISTRATORS") }));

        expect(handlers.onFilterChange).toHaveBeenCalledWith("attacker", "ADMINISTRATORS");
    });

    it.each([
        { language: "English", t: englishT, filter: "", shown: "All" },
        { language: "German", t: germanT, filter: "", shown: "Alle" },
        {
            language: "English",
            t: englishT,
            filter: "USER_INTERFACE,USER_BEHAVIOUR",
            shown: "User Interface, User Behaviour",
        },
    ])("shows the point of attack filter '$filter' as '$shown' in $language", ({ t, filter, shown }) => {
        const { byField } = columnByField({
            t,
            columnFilters: { pointOfAttack: filter },
            expandedFilters: { pointOfAttack: true },
        });
        renderHeader(byField["pointOfAttack"]);

        expect(screen.getByRole("combobox")).toHaveTextContent(shown);
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
                englishT
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
                englishT
            )
        ).toBe("Unknown > Test");
    });

    it("returns the plain component name for non-interface points of attack", () => {
        expect(
            formatComponentName(
                {
                    pointOfAttack: POINTS_OF_ATTACK.DATA_STORAGE_INFRASTRUCTURE,
                    componentName: "Database",
                    interfaceName: null,
                },
                englishT
            )
        ).toBe("Database");
    });
});

describe("createThreatsColumns — no threats placeholder", () => {
    it("spans every visible column and shows the placeholder for a generic threat without threats", () => {
        const { byField } = columnByField();
        const nameColumn = byField["name"]!;
        const colSpan = nameColumn.colSpan as (
            value: unknown,
            row: ThreatsGridRow,
            column: unknown,
            apiRef: { current: { getVisibleColumns: () => unknown[] } }
        ) => number | undefined;
        const gridWithVisibleColumns = (count: number) => ({
            current: { getVisibleColumns: () => Array.from({ length: count }) },
        });

        expect(colSpan(undefined, noThreatsRow, nameColumn, gridWithVisibleColumns(11))).toBe(11);
        expect(colSpan(undefined, noThreatsRow, nameColumn, gridWithVisibleColumns(9))).toBe(9);
        expect(colSpan(undefined, threatRow, nameColumn, gridWithVisibleColumns(11))).toBeUndefined();

        renderCell(nameColumn, noThreatsRow);
        expect(screen.getByText("No threats for this generic threat.")).toBeInTheDocument();
    });
});

describe("createThreatsColumns — description column", () => {
    it("shows a threat's own description", () => {
        const { byField } = columnByField();
        renderCell(byField["description"], threatRow);

        expect(screen.getByTestId("threats-page_threats-list-entry_description")).toHaveTextContent("threat desc");
    });

    it("stays empty on generic threat rows, whose description the filter does not match", () => {
        const { byField } = columnByField();
        const { container } = renderCell(byField["description"], genericRow);

        expect(container).toBeEmptyDOMElement();
    });
});
