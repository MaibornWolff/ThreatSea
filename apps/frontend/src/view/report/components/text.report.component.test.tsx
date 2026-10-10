import { Text } from "#view/report/components/text.report.component.tsx";
import { fontColor } from "#view/report/report.style.ts";
import { getText, getTexts, renderPdfTree, runRenderProps } from "#test-utils/render-pdf-tree.tsx";

describe("Text (report)", () => {
    it.each([
        ["header", 20],
        ["large", 12],
        ["small", 10],
    ] as const)("renders size %s with font size %d", async (size, expectedFontSize) => {
        const tree = await renderPdfTree(<Text size={size}>Hello</Text>);

        expect(tree.style).toMatchObject({ fontSize: expectedFontSize, fontFamily: "Poppins", color: fontColor });
        expect(getTexts(tree)).toEqual(["Hello"]);
    });

    it("defaults to the large size", async () => {
        const tree = await renderPdfTree(<Text>Hello</Text>);

        expect(tree.style).toMatchObject({ fontSize: 12 });
    });

    it("lets an explicit style and color override the defaults", async () => {
        const tree = await renderPdfTree(
            <Text color="#ff0000" style={{ fontSize: 8, fontWeight: 600 }}>
                Hello
            </Text>
        );

        expect(tree.style).toMatchObject({ fontSize: 8, fontWeight: 600, color: "#ff0000" });
    });

    it("renders a single space instead of an empty text node", async () => {
        const tree = await renderPdfTree(<Text>{""}</Text>);

        expect(getTexts(tree)).toEqual([" "]);
    });

    it("passes a render prop through to react-pdf instead of static children", async () => {
        const tree = await renderPdfTree(<Text render={({ pageNumber }) => `Page ${pageNumber}`} />);

        expect(tree.children).toEqual([]);
        expect(runRenderProps(tree, { pageNumber: 3, totalPages: 9 }).map(getText)).toEqual(["Page 3"]);
    });
});
