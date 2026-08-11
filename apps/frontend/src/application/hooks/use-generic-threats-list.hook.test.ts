import { act, renderHook, waitFor } from "@testing-library/react";
import { GenericThreatsAPI } from "#api/generic-threats.api.ts";
import type { GenericThreatWithExtendedChildren } from "#api/types/generic-threat.types.ts";
import { createThreat } from "#test-utils/builders.ts";
import { useGenericThreatsList } from "./use-generic-threats-list.hook";

vi.mock("#api/generic-threats.api.ts", () => ({
    GenericThreatsAPI: { getGenericThreatsWithExtendedChildren: vi.fn() },
}));

const genericThreat = (id: number, name: string): GenericThreatWithExtendedChildren =>
    ({ id, name, children: [createThreat({ id: id * 10 })] }) as unknown as GenericThreatWithExtendedChildren;

describe("useGenericThreatsList", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(GenericThreatsAPI.getGenericThreatsWithExtendedChildren).mockResolvedValue([
            genericThreat(1, "Alpha"),
            genericThreat(2, "Beta"),
        ]);
    });

    it("expands and collapses every loaded generic threat via setAllGenericThreatsExpanded", async () => {
        const { result } = renderHook(() => useGenericThreatsList({ projectId: 1 }));

        await waitFor(() => expect(result.current.genericThreats).toHaveLength(2));
        expect(result.current.expandedGenericThreatIds).toEqual({});

        act(() => result.current.setAllGenericThreatsExpanded(true));
        expect(result.current.expandedGenericThreatIds).toEqual({ 1: true, 2: true });

        act(() => result.current.setAllGenericThreatsExpanded(false));
        expect(result.current.expandedGenericThreatIds).toEqual({});
    });
});
