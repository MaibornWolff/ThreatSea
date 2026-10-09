import type { GenericThreatWithExtendedThreats } from "#api/types/generic-threat.types.ts";
import { THREAT_STATUSES } from "#api/types/threat-statuses.types.ts";
import type { ExtendedThreatWithMetrics } from "#application/hooks/use-generic-threats-list.hook.ts";
import { ALL_ROWS_PAGE_SIZE } from "#application/hooks/use-page-size-options.hook.ts";
import { createThreat } from "#test-utils/builders.ts";
import { translationUtil } from "#utils/translations.ts";
import {
    buildThreatsRows,
    isThreatOnlySortField,
    type ThreatsPagination,
    type ThreatsSort,
} from "./build-threats-rows";

const englishT = translationUtil.getFixedT("en", "threatsPage");

const genericThreat = (id: number, name: string): GenericThreatWithExtendedThreats =>
    ({
        id,
        name,
        pointOfAttack: "USER_INTERFACE",
        attacker: "UNAUTHORISED_PARTIES",
        componentName: "Test Component",
        interfaceName: null,
        threats: [],
    }) as unknown as GenericThreatWithExtendedThreats;

const threat = (
    id: number,
    genericThreatId: number,
    overrides: Partial<ExtendedThreatWithMetrics> = {}
): ExtendedThreatWithMetrics => ({
    ...createThreat({ id, genericThreatId }),
    damage: 1,
    risk: 3,
    ...overrides,
});

// Spoofing (1) has two threats with its name; Tampering (2) has one renamed threat.
const genericThreats = [genericThreat(1, "Spoofing of identity"), genericThreat(2, "Tampering with data")];
const threatsByGenericThreatId = {
    1: [
        threat(11, 1, { name: "Spoofing of identity", status: THREAT_STATUSES.FINALIZED }),
        threat(12, 1, { name: "Spoofing of identity (duplicate)" }),
    ],
    2: [threat(21, 2, { name: "Checksum bypass" })],
};

const build = ({
    columnFilters = {},
    expanded = {},
    threats = threatsByGenericThreatId,
    generics = genericThreats,
    sort = { field: "name", direction: "asc" },
    page = { page: 0, pageSize: 100 },
}: {
    columnFilters?: Record<string, string>;
    expanded?: Record<number, boolean>;
    threats?: Record<number, ExtendedThreatWithMetrics[]>;
    generics?: GenericThreatWithExtendedThreats[];
    sort?: ThreatsSort;
    page?: ThreatsPagination;
} = {}) =>
    buildThreatsRows({
        genericThreats: generics,
        threatsByGenericThreatId: threats,
        expandedGenericThreatIds: expanded,
        columnFilters,
        sort,
        page,
        t: englishT,
    });

// A generic threat row reads "rowId (shown/total)".
const summarize = ({ rows }: ReturnType<typeof buildThreatsRows>) =>
    rows.map((row) =>
        row.rowType === "genericThreat" ? `${row.rowId} (${row.threatCount}/${row.totalThreatCount})` : row.rowId
    );

describe("buildThreatsRows", () => {
    it("lists every generic threat with its threat count while collapsed", () => {
        expect(summarize(build())).toEqual(["generic-1 (2/2)", "generic-2 (1/1)"]);
    });

    it("lists an expanded generic threat's threats under it", () => {
        expect(summarize(build({ expanded: { 1: true } }))).toEqual([
            "generic-1 (2/2)",
            "threat-11",
            "threat-12",
            "generic-2 (1/1)",
        ]);
    });

    it("shows the empty placeholder under an expanded generic threat without threats", () => {
        expect(summarize(build({ expanded: { 2: true }, threats: { ...threatsByGenericThreatId, 2: [] } }))).toEqual([
            "generic-1 (2/2)",
            "generic-2 (0/0)",
            "empty-2",
        ]);
    });

    it("hides a generic threat when neither it nor any of its threats matches a filter", () => {
        expect(summarize(build({ columnFilters: { name: "spoofing" } }))).toEqual(["generic-1 (2/2)"]);
    });

    it("keeps a generic threat for a matching threat and lists only the matching threats", () => {
        expect(summarize(build({ columnFilters: { name: "duplicate" }, expanded: { 1: true } }))).toEqual([
            "generic-1 (1/2)",
            "threat-12",
        ]);
    });

    it("never matches a generic threat itself on a threat-only filter", () => {
        expect(
            summarize(build({ columnFilters: { status: THREAT_STATUSES.FINALIZED }, expanded: { 1: true } }))
        ).toEqual(["generic-1 (1/2)", "threat-11"]);
    });

    it("lists all threats of a generic threat matching the name filter, even renamed ones", () => {
        expect(summarize(build({ columnFilters: { name: "tampering" }, expanded: { 2: true } }))).toEqual([
            "generic-2 (1/1)",
            "threat-21",
        ]);
    });

    it("still applies threat-only filters to the threats of a generic threat matching the name filter", () => {
        expect(
            summarize(
                build({
                    columnFilters: { name: "spoofing", status: THREAT_STATUSES.FINALIZED },
                    expanded: { 1: true },
                })
            )
        ).toEqual(["generic-1 (1/2)", "threat-11"]);
        // Tampering matches the name, but its only threat is not finalized.
        expect(summarize(build({ columnFilters: { name: "tampering", status: THREAT_STATUSES.FINALIZED } }))).toEqual(
            []
        );
    });
});

describe("buildThreatsRows — sorting", () => {
    const expandAll = { 1: true, 2: true };
    // Risk 4/12 under Spoofing, 20 under Tampering; statuses finalized/new and in progress.
    const ranked = {
        1: [
            threat(11, 1, { name: "Spoofing of identity", risk: 4, status: THREAT_STATUSES.FINALIZED }),
            threat(12, 1, { name: "Spoofing of identity (duplicate)", risk: 12, status: THREAT_STATUSES.NEW }),
        ],
        2: [threat(21, 2, { name: "Checksum bypass", risk: 20, status: THREAT_STATUSES.IN_PROGRESS })],
    };

    it("sorts generic threats by name descending, with their threats in the same direction", () => {
        expect(summarize(build({ sort: { field: "name", direction: "desc" }, expanded: expandAll }))).toEqual([
            "generic-2 (1/1)",
            "threat-21",
            "generic-1 (2/2)",
            "threat-12",
            "threat-11",
        ]);
    });

    it("sorts generic threats by their own component, keeping their threats in name order", () => {
        const generics = [
            { ...genericThreat(1, "Spoofing of identity"), componentName: "Alpha server" },
            { ...genericThreat(2, "Tampering with data"), componentName: "Zulu gateway" },
        ] as GenericThreatWithExtendedThreats[];
        expect(
            summarize(build({ generics, sort: { field: "componentName", direction: "desc" }, expanded: expandAll }))
        ).toEqual(["generic-2 (1/1)", "threat-21", "generic-1 (2/2)", "threat-11", "threat-12"]);
    });

    it("ranks generic threats by their riskiest threat for risk descending", () => {
        expect(
            summarize(build({ threats: ranked, sort: { field: "risk", direction: "desc" }, expanded: expandAll }))
        ).toEqual(["generic-2 (1/1)", "threat-21", "generic-1 (2/2)", "threat-12", "threat-11"]);
    });

    it("ranks generic threats by their least risky threat for risk ascending", () => {
        expect(
            summarize(build({ threats: ranked, sort: { field: "risk", direction: "asc" }, expanded: expandAll }))
        ).toEqual(["generic-1 (2/2)", "threat-11", "threat-12", "generic-2 (1/1)", "threat-21"]);
    });

    it("sorts the status in workflow order, not alphabetically", () => {
        // new < in progress < finalized: Spoofing's new threat ranks it before Tampering's in-progress one.
        expect(
            summarize(build({ threats: ranked, sort: { field: "status", direction: "asc" }, expanded: expandAll }))
        ).toEqual(["generic-1 (2/2)", "threat-12", "threat-11", "generic-2 (1/1)", "threat-21"]);
    });

    it("lists a generic threat without threats last when sorting by a threat-only column", () => {
        const threats = { 1: ranked[1], 2: [] };
        for (const direction of ["asc", "desc"] as const) {
            expect(summarize(build({ threats, sort: { field: "risk", direction } }))).toEqual([
                "generic-1 (2/2)",
                "generic-2 (0/0)",
            ]);
        }
    });
});

describe("buildThreatsRows — pagination", () => {
    it("pages by generic threat, keeping an expanded generic threat's threats on its page", () => {
        const expanded = { 1: true, 2: true };

        const firstPage = build({ expanded, page: { page: 0, pageSize: 1 } });
        expect(summarize(firstPage)).toEqual(["generic-1 (2/2)", "threat-11", "threat-12"]);
        expect(firstPage.genericThreatCount).toBe(2);

        expect(summarize(build({ expanded, page: { page: 1, pageSize: 1 } }))).toEqual([
            "generic-2 (1/1)",
            "threat-21",
        ]);
    });

    it("pages after sorting, so the first page holds the top-ranked generic threats", () => {
        expect(
            summarize(build({ sort: { field: "name", direction: "desc" }, page: { page: 0, pageSize: 1 } }))
        ).toEqual(["generic-2 (1/1)"]);
    });

    it("puts every generic threat on one page for the 'All' page size", () => {
        const result = build({ expanded: { 1: true, 2: true }, page: { page: 0, pageSize: ALL_ROWS_PAGE_SIZE } });
        expect(summarize(result)).toEqual([
            "generic-1 (2/2)",
            "threat-11",
            "threat-12",
            "generic-2 (1/1)",
            "threat-21",
        ]);
        expect(result.genericThreatCount).toBe(2);
    });

    it("ignores a leftover page index for the 'All' page size", () => {
        expect(summarize(build({ page: { page: 1, pageSize: ALL_ROWS_PAGE_SIZE } }))).toEqual([
            "generic-1 (2/2)",
            "generic-2 (1/1)",
        ]);
    });

    it("counts the generic threats matching the filters across all pages", () => {
        const result = build({ columnFilters: { name: "spoofing" }, page: { page: 0, pageSize: 1 } });
        expect(result.genericThreatCount).toBe(1);
    });
});

describe("isThreatOnlySortField", () => {
    it("tells the columns only threat rows have values for from the generic threat's own columns", () => {
        expect(["description", "assets", "probability", "damage", "risk", "status"].every(isThreatOnlySortField)).toBe(
            true
        );
        expect(["name", "componentName", "pointOfAttack", "attacker"].some(isThreatOnlySortField)).toBe(false);
    });
});
