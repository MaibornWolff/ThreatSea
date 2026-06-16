import { screen } from "@testing-library/react";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { ThreatRiskPreview } from "./threat-risk-preview.component";

describe("ThreatRiskPreview", () => {
    it("shows the gross and net risk values in their own pills", () => {
        renderWithProviders(<ThreatRiskPreview grossRisk={20} grossColor="red" netRisk={8} netColor="green" />);

        expect(screen.getByTestId("GrossRisk")).toHaveTextContent("20");
        expect(screen.getByTestId("NetRisk")).toHaveTextContent("8");
    });

    it("labels each pill as gross or net", () => {
        renderWithProviders(<ThreatRiskPreview grossRisk={20} grossColor="red" netRisk={8} netColor="green" />);

        expect(screen.getByTestId("GrossRisk").textContent).toMatch(/gross|brutto/i);
        expect(screen.getByTestId("NetRisk").textContent).toMatch(/net|netto/i);
    });
});
