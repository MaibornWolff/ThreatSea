import {
    assetCardFitsOnOnePage,
    componentCardFitsOnOnePage,
    measureCardFitsOnOnePage,
    threatCardFitsOnOnePage,
} from "#view/report/pages/report-card-page-fit.ts";

const NAME_255 = "n".repeat(255);

describe("threatCardFitsOnOnePage", () => {
    const card = (overrides: Partial<Parameters<typeof threatCardFitsOnOnePage>[0]> = {}) => ({
        name: "detremental access",
        description: "An attacker gains access to stored contents.",
        assets: [{ name: "test asset1" }],
        measures: [],
        ...overrides,
    });

    it("keeps a small card atomic", () => {
        expect(threatCardFitsOnOnePage(card())).toBe(true);
    });

    it("wraps a card with a page-spanning description", () => {
        expect(threatCardFitsOnOnePage(card({ description: "x".repeat(3000) }))).toBe(false);
    });

    it("wraps a card made tall by many measures with long names, even with short descriptions", () => {
        const measures = Array.from({ length: 9 }, () => ({ name: NAME_255, description: "Applied." }));
        expect(threatCardFitsOnOnePage(card({ measures }))).toBe(false);
    });

    it("wraps a card with many long-named assets", () => {
        const assets = Array.from({ length: 20 }, () => ({ name: NAME_255 }));
        expect(threatCardFitsOnOnePage(card({ assets }))).toBe(false);
    });

    it("treats missing texts as empty and stays atomic when otherwise small", () => {
        expect(threatCardFitsOnOnePage(card({ name: null, description: undefined }))).toBe(true);
    });
});

describe("assetCardFitsOnOnePage", () => {
    it("keeps a small card atomic", () => {
        expect(
            assetCardFitsOnOnePage({
                name: "Customer Database",
                description: "Contains all customer data.",
                confidentialityJustification: "Personal data.",
                integrityJustification: "Billing depends on it.",
                availabilityJustification: "Needed for operations.",
            })
        ).toBe(true);
    });

    it("wraps a card with page-spanning justifications", () => {
        expect(
            assetCardFitsOnOnePage({
                name: "Customer Database",
                description: "x".repeat(1500),
                confidentialityJustification: "x".repeat(1500),
                integrityJustification: "x".repeat(1500),
                availabilityJustification: null,
            })
        ).toBe(false);
    });
});

describe("componentCardFitsOnOnePage", () => {
    it("keeps a small card atomic", () => {
        expect(componentCardFitsOnOnePage({ name: "Database Server", description: "Stores the data." })).toBe(true);
    });

    it("wraps a card with a page-spanning description", () => {
        expect(componentCardFitsOnOnePage({ name: "Database Server", description: "x".repeat(4000) })).toBe(false);
    });
});

describe("measureCardFitsOnOnePage", () => {
    it("keeps a small card atomic", () => {
        expect(
            measureCardFitsOnOnePage({
                name: "Parameterised queries",
                description: "Added to all database calls.",
                threats: [{ name: "SQL Injection" }],
            })
        ).toBe(true);
    });

    it("wraps a card with many long-named linked threats", () => {
        const threats = Array.from({ length: 25 }, () => ({ name: NAME_255 }));
        expect(measureCardFitsOnOnePage({ name: "Central patching", description: "Rolled out.", threats })).toBe(false);
    });
});
