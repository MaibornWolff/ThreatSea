import { calcDamage } from "./helpers";

describe("calcDamage", () => {
    const assets = [
        { confidentiality: 1, integrity: 4, availability: 2 },
        { confidentiality: 3, integrity: 2, availability: 5 },
    ];

    it("returns the highest confidentiality across assets when only confidentiality is impacted", () => {
        const damage = calcDamage({
            assets,
            confidentiality: true,
            integrity: false,
            availability: false,
        });

        expect(damage).toBe(3);
    });

    it("returns the highest integrity across assets when only integrity is impacted", () => {
        const damage = calcDamage({
            assets,
            confidentiality: false,
            integrity: true,
            availability: false,
        });

        expect(damage).toBe(4);
    });

    it("returns the highest availability across assets when only availability is impacted", () => {
        const damage = calcDamage({
            assets,
            confidentiality: false,
            integrity: false,
            availability: true,
        });

        expect(damage).toBe(5);
    });

    it("returns the overall max across only impacted protection goals", () => {
        const damage = calcDamage({
            assets,
            confidentiality: true,
            integrity: true,
            availability: false,
        });

        expect(damage).toBe(4);
    });
});
