import { Matrix } from "#view/report/components/matrix.report.component.tsx";
import { MATRIX_COLOR, MATRIX_FALLBACK_COLOR } from "#view/colors/matrix.ts";
import type { MatrixColorKey } from "#view/colors/matrix.ts";
import { findAllByType, getTexts, renderPdfTree } from "#test-utils/render-pdf-tree.tsx";

interface MatrixCell {
    color: MatrixColorKey;
    amount?: number;
}

const emptyMatrix = (): MatrixCell[][] =>
    Array.from({ length: 5 }, () => Array.from({ length: 5 }, (): MatrixCell => ({ color: "green" })));

const backgroundOf = (style: unknown) => (style as Record<string, unknown>)["backgroundColor"];

describe("Matrix (report)", () => {
    it("labels the axes with probability 5 to 1 and damage 1 to 5", async () => {
        const tree = await renderPdfTree(<Matrix language="en" title="Before" data={emptyMatrix()} />);

        const texts = getTexts(tree);
        expect(texts[0]).toBe("Probability");
        expect(texts.filter((text) => /^[1-5]$/.test(text))).toEqual([
            "5",
            "4",
            "3",
            "2",
            "1",
            "1",
            "2",
            "3",
            "4",
            "5",
        ]);
        expect(texts.slice(-2)).toEqual(["Damage", "Before"]);
    });

    it("shows the threat count only in occupied cells and colours them stronger", async () => {
        const data = emptyMatrix();
        data[0]![4] = { color: "red", amount: 3 };

        const tree = await renderPdfTree(<Matrix language="en" title={undefined} data={data} />);

        const occupiedCell = findAllByType(tree, "VIEW").find(
            (view) =>
                getTexts(view).join("") === "3" && view.style && backgroundOf(view.style) === MATRIX_COLOR.red.standard
        );
        expect(occupiedCell).toBeDefined();
        const emptyCells = findAllByType(tree, "VIEW").filter(
            (view) => backgroundOf(view.style) === MATRIX_COLOR.green.light
        );
        expect(emptyCells).toHaveLength(24);
        expect(emptyCells.every((cell) => getTexts(cell).join("") === " ")).toBe(true);
    });

    it("falls back to the neutral colour for an unknown colour key", async () => {
        const data = emptyMatrix();
        data[2]![2] = { color: "purple" as MatrixColorKey, amount: 1 };

        const tree = await renderPdfTree(<Matrix language="en" title={undefined} data={data} />);

        expect(findAllByType(tree, "VIEW").some((view) => backgroundOf(view.style) === MATRIX_FALLBACK_COLOR)).toBe(
            true
        );
    });

    it("renders only the axes and no title when there is no data", async () => {
        const tree = await renderPdfTree(<Matrix language="en" title={undefined} data={null} />);

        expect(getTexts(tree)).toEqual(["Probability", "1", "2", "3", "4", "5", "Damage"]);
    });

    it("translates the axis labels", async () => {
        const tree = await renderPdfTree(<Matrix language="de" title="Davor" data={null} />);

        expect(getTexts(tree)).toEqual(expect.arrayContaining(["Wahrscheinlichkeit", "Schaden", "Davor"]));
    });
});
