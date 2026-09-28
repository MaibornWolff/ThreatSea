import type { GenericThreatWithExtendedThreats } from "#api/types/generic-threat.types.ts";
import { THREAT_STATUSES } from "#api/types/threat-statuses.types.ts";
import type { ExtendedThreatWithMetrics } from "#application/hooks/use-generic-threats-list.hook.ts";
import { createThreat } from "#test-utils/builders.ts";
import { translationUtil } from "#utils/translations.ts";
import { buildThreatsRows } from "./build-threats-rows";

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
}: {
    columnFilters?: Record<string, string>;
    expanded?: Record<number, boolean>;
    threats?: Record<number, ExtendedThreatWithMetrics[]>;
} = {}) =>
    buildThreatsRows({
        genericThreats,
        threatsByGenericThreatId: threats,
        expandedGenericThreatIds: expanded,
        columnFilters,
        t: englishT,
    });

const summarize = (rows: ReturnType<typeof buildThreatsRows>) =>
    rows.map((row) => (row.rowType === "genericThreat" ? `${row.rowId} (${row.threatCount})` : row.rowId));

describe("buildThreatsRows", () => {
    it("lists every generic threat with its threat count while collapsed", () => {
        expect(summarize(build())).toEqual(["generic-1 (2)", "generic-2 (1)"]);
    });

    it("lists an expanded generic threat's threats under it", () => {
        expect(summarize(build({ expanded: { 1: true } }))).toEqual([
            "generic-1 (2)",
            "threat-11",
            "threat-12",
            "generic-2 (1)",
        ]);
    });

    it("shows the empty placeholder under an expanded generic threat without threats", () => {
        expect(summarize(build({ expanded: { 2: true }, threats: { ...threatsByGenericThreatId, 2: [] } }))).toEqual([
            "generic-1 (2)",
            "generic-2 (0)",
            "empty-2",
        ]);
    });

    it("hides a generic threat when neither it nor any of its threats matches a filter", () => {
        expect(summarize(build({ columnFilters: { name: "spoofing" } }))).toEqual(["generic-1 (2)"]);
    });

    it("keeps a generic threat for a matching threat and lists only the matching threats", () => {
        expect(summarize(build({ columnFilters: { name: "duplicate" }, expanded: { 1: true } }))).toEqual([
            "generic-1 (1)",
            "threat-12",
        ]);
    });

    it("never matches a generic threat itself on a threat-only filter", () => {
        expect(
            summarize(build({ columnFilters: { status: THREAT_STATUSES.FINALIZED }, expanded: { 1: true } }))
        ).toEqual(["generic-1 (1)", "threat-11"]);
    });

    it("keeps a generic threat matching the name filter even when none of its threats does", () => {
        expect(summarize(build({ columnFilters: { name: "tampering" }, expanded: { 2: true } }))).toEqual([
            "generic-2 (0)",
            "empty-2",
        ]);
    });
});
