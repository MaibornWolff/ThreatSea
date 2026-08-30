import { applyColumnFilters } from "./column-filters";

interface Row {
    id: number;
    name: string;
    confidentiality: number;
    createdAt: string;
}

const rows: Row[] = [
    { id: 1, name: "Alpha", confidentiality: 3, createdAt: "2025-04-08" },
    { id: 2, name: "Beta", confidentiality: 1, createdAt: "2025-05-01" },
    { id: 3, name: "alphabet", confidentiality: 4, createdAt: "2024-12-24" },
];

describe("applyColumnFilters", () => {
    it("returns the input rows untouched when no filter is active", () => {
        expect(applyColumnFilters(rows, {})).toBe(rows);
        expect(applyColumnFilters(rows, { name: "   " })).toBe(rows);
    });

    it("matches case-insensitively by substring", () => {
        expect(applyColumnFilters(rows, { name: "ALPHA" }).map((r) => r.id)).toEqual([1, 3]);
    });

    it("filters numeric fields via their string form", () => {
        expect(applyColumnFilters(rows, { confidentiality: "3" }).map((r) => r.id)).toEqual([1]);
    });

    it("combines multiple column filters with AND", () => {
        expect(applyColumnFilters(rows, { name: "alpha", confidentiality: "4" }).map((r) => r.id)).toEqual([3]);
        expect(applyColumnFilters(rows, { name: "beta", confidentiality: "4" })).toEqual([]);
    });

    it("uses a custom value getter when provided", () => {
        const filtered = applyColumnFilters(
            rows,
            { createdAt: "december" },
            {
                createdAt: (row) => (row.createdAt.startsWith("2024-12") ? "December 2024" : row.createdAt),
            }
        );
        expect(filtered.map((r) => r.id)).toEqual([3]);
    });

    it("treats null and undefined field values as empty strings", () => {
        const sparse = [
            { id: 1, name: null },
            { id: 2, name: "x" },
        ] as unknown as Row[];
        expect(applyColumnFilters(sparse, { name: "x" }).map((r) => r.id)).toEqual([2]);
        expect(applyColumnFilters(sparse, { name: "null" })).toEqual([]);
    });
});
