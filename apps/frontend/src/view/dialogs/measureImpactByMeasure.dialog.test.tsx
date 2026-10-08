import { screen, within } from "@testing-library/react";
import { CatalogMeasuresApi } from "#api/catalog-measures.api.ts";
import { GenericThreatsAPI } from "#api/generic-threats.api.ts";
import { MeasureImpactsApi } from "#api/measureImpacts.api.ts";
import { MeasuresAPI } from "#api/measures.api.ts";
import { createGenericThreatWithThreats, createMeasure, createProject, createThreat } from "#test-utils/builders.ts";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import MeasureImpactByMeasureDialog from "./measureImpactByMeasure.dialog";

const project = createProject({ id: 7 });
const threat = createThreat({ id: 42, projectId: 7, name: "Eavesdropping" });
const createdMeasure = createMeasure({ id: 5, projectId: 7, name: "Encrypt traffic" });

// Spy on the real modules instead of vi.mock (see AGENTS.md). The dialog loads threats, measures,
// measure impacts and catalog measures on mount; restoreMocks removes spies after every test.
beforeEach(() => {
    vi.spyOn(GenericThreatsAPI, "getGenericThreatsWithExtendedThreats").mockResolvedValue([
        createGenericThreatWithThreats({ threats: [threat] }),
    ]);
    vi.spyOn(MeasuresAPI, "getMeasures").mockResolvedValue([createdMeasure]);
    vi.spyOn(MeasureImpactsApi, "getMeasureImpacts").mockResolvedValue([]);
    vi.spyOn(CatalogMeasuresApi, "getCatalogMeasures").mockResolvedValue([]);
});

describe("MeasureImpactByMeasureDialog", () => {
    it("preselects the measure just created, and forgets it once the dialog closes", async () => {
        // The save-measure flow stores the new measure's id here before returning to this dialog.
        const { store, unmount } = renderWithProviders(
            <MeasureImpactByMeasureDialog project={project} threat={{ ...threat, damage: 4 }} measureImpact={null} />,
            { preloadedState: { dialogs: { measureImpacts: { measureId: 5 } } } }
        );

        const measureSelect = screen.getByRole("combobox", { name: "Measure" });
        expect(await within(measureSelect).findByText("Encrypt traffic")).toBeInTheDocument();

        unmount();

        expect(store.getState().dialogs["measureImpacts"]).toBeNull();
    });
});
