import { SystemImageLegend } from "#view/report/components/system-image-legend.report.component.tsx";
import { POA_COLORS } from "#view/colors/pointsOfAttack.colors.ts";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import { findAllByType, getTexts, renderPdfTree } from "#test-utils/render-pdf-tree.tsx";

describe("SystemImageLegend (report)", () => {
    it("lists every point of attack in English", async () => {
        const tree = await renderPdfTree(<SystemImageLegend language="en" />);

        expect(getTexts(tree)).toEqual([
            "User Interface",
            "Processing Infrastructure",
            "Data Storage Infrastructure",
            "Communication Infrastructure",
            "Communication Interfaces",
            "User Behaviour",
        ]);
    });

    it("lists every point of attack in German", async () => {
        const tree = await renderPdfTree(<SystemImageLegend language="de" />);

        expect(getTexts(tree)).toEqual([
            "Benutzerschnittstelle",
            "Ausführungsinfrastruktur",
            "Datenablagestruktur",
            "Kommunikationsinfrastruktur",
            "Kommunikationsschnittstelle",
            "Benutzerverhalten",
        ]);
    });

    it("shows a dot in the editor colour of each point of attack", async () => {
        const tree = await renderPdfTree(<SystemImageLegend language="en" />);

        const dotColors = findAllByType(tree, "VIEW")
            .filter((view) => view.children.length === 0)
            .map((dot) => (dot.style as Record<string, unknown>)["backgroundColor"]);
        expect(dotColors).toEqual(
            Object.values(POINTS_OF_ATTACK).map((pointOfAttack) => POA_COLORS[pointOfAttack].normal)
        );
    });
});
