import { ThreatMatrix } from "#view/report/components/threatMatrix.report.component.tsx";
import { getTexts, renderPdfTree } from "#test-utils/render-pdf-tree.tsx";

const attackerNames = ["Unauthorised Parties", "System Users", "Application Users", "(Technical) Administrators"];

describe("ThreatMatrix (report)", () => {
    it("renders the attackers as column headers", async () => {
        const tree = await renderPdfTree(<ThreatMatrix language="en" />);

        expect(getTexts(tree).slice(0, 4)).toEqual(attackerNames);
    });

    it("renders one row per point of attack with the threat each attacker poses", async () => {
        const tree = await renderPdfTree(<ThreatMatrix language="en" />);

        const rows = tree.children.slice(1);
        expect(rows).toHaveLength(6);
        expect(getTexts(rows[0]!)).toEqual(["User Interface", "Physical UI access", " ", "Detrimental UI usage", " "]);
    });

    it("leaves the cell blank where an attacker has no threat on that point of attack", async () => {
        const tree = await renderPdfTree(<ThreatMatrix language="en" />);

        const userBehaviourRow = tree.children.at(-1)!;
        expect(getTexts(userBehaviourRow)).toEqual(["User Behaviour", "Deception", " ", " ", " "]);
    });

    it("renders the headers in German", async () => {
        const tree = await renderPdfTree(<ThreatMatrix language="de" />);

        expect(getTexts(tree)).toEqual(
            expect.arrayContaining(["Dritte", "Systembenutzer", "Benutzerschnittstelle", "Benutzerverhalten"])
        );
    });
});
