import { SystemImage } from "#view/report/components/system-image.report.component.tsx";
import { findAllByType, renderPdfTree } from "#test-utils/render-pdf-tree.tsx";

describe("SystemImage (report)", () => {
    it("renders the system image inside a bordered frame", async () => {
        const tree = await renderPdfTree(<SystemImage src="data:image/png;base64,abc" style={{ marginTop: 48 }} />);

        const images = findAllByType(tree, "IMAGE");
        expect(images).toHaveLength(1);
        expect(images[0]!.props["src"]).toBe("data:image/png;base64,abc");
        expect(tree.style).toMatchObject({ borderRadius: 5, marginTop: 48 });
    });

    it.each([{ src: null }, { src: "" }, {}])("renders an empty frame for %j", async (sourceProps) => {
        const tree = await renderPdfTree(<SystemImage {...sourceProps} />);

        expect(tree.type).toBe("VIEW");
        expect(findAllByType(tree, "IMAGE")).toEqual([]);
    });
});
