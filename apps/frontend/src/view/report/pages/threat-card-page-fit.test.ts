import { threatCardFitsOnOnePage } from "#view/report/pages/threat-card-page-fit.ts";

const makeAssets = (count: number) => Array.from({ length: count }, () => ({}));
const makeMeasures = (count: number, descriptionLength: number) =>
    Array.from({ length: count }, () => ({ description: "x".repeat(descriptionLength) }));

const card = (
    overrides: {
        description?: string | null | undefined;
        assets?: readonly unknown[];
        measures?: readonly { description?: string | null }[];
    } = {}
) => ({ description: "" as string | null | undefined, assets: [], measures: [], ...overrides });

describe("threatCardFitsOnOnePage", () => {
    it("keeps a small card atomic", () => {
        expect(threatCardFitsOnOnePage(card({ description: "A short threat description." }))).toBe(true);
    });

    it("lets a card with a page-spanning description wrap", () => {
        expect(threatCardFitsOnOnePage(card({ description: "x".repeat(3000) }))).toBe(false);
    });

    it("lets a card with many assets wrap", () => {
        expect(threatCardFitsOnOnePage(card({ assets: makeAssets(60) }))).toBe(false);
    });

    it("keeps a card with a few short measures atomic", () => {
        expect(threatCardFitsOnOnePage(card({ description: "Short.", measures: makeMeasures(2, 20) }))).toBe(true);
    });

    it("wraps a card made tall by several long-described measures, even with a short description", () => {
        expect(threatCardFitsOnOnePage(card({ description: "Short.", measures: makeMeasures(20, 200) }))).toBe(false);
    });

    it("treats a missing description as empty and stays atomic when otherwise small", () => {
        expect(threatCardFitsOnOnePage(card({ description: null }))).toBe(true);
        expect(threatCardFitsOnOnePage(card({ description: undefined }))).toBe(true);
    });

    it("flips from atomic to wrapping as the description crosses roughly one page", () => {
        expect(threatCardFitsOnOnePage(card({ description: "x".repeat(1200) }))).toBe(true);
        expect(threatCardFitsOnOnePage(card({ description: "x".repeat(1600) }))).toBe(false);
    });
});
