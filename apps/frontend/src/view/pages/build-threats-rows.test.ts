import type { GenericThreatWithExtendedThreats } from "#api/types/generic-threat.types.ts";
import { THREAT_STATUSES } from "#api/types/threat-statuses.types.ts";
import type { ExtendedThreatWithMetrics } from "#application/hooks/use-generic-threats-list.hook.ts";
import { createThreat } from "#test-utils/builders.ts";
import { translationUtil } from "#utils/translations.ts";
import { buildThreatsRows, type ThreatsPagination } from "./build-threats-rows";

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
    page = { page: 0, pageSize: 100 },
}: {
    columnFilters?: Record<string, string>;
    expanded?: Record<number, boolean>;
    threats?: Record<number, ExtendedThreatWithMetrics[]>;
    page?: ThreatsPagination;
} = {}) =>
    buildThreatsRows({
        genericThreats,
        threatsByGenericThreatId: threats,
        expandedGenericThreatIds: expanded,
        columnFilters,
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

    it("counts the generic threats matching the filters across all pages", () => {
        const result = build({ columnFilters: { name: "spoofing" }, page: { page: 0, pageSize: 1 } });
        expect(result.genericThreatCount).toBe(1);
    });
});
