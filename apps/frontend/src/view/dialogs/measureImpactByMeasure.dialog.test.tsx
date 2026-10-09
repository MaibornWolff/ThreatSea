import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocation } from "react-router";
import { CatalogMeasuresApi } from "#api/catalog-measures.api.ts";
import { GenericThreatsAPI } from "#api/generic-threats.api.ts";
import { MeasureImpactsApi } from "#api/measureImpacts.api.ts";
import { MeasuresAPI } from "#api/measures.api.ts";
import type { MeasureImpact } from "#api/types/measure-impact.types.ts";
import {
    createGenericThreatWithThreats,
    createMeasure,
    createMeasureImpact,
    createProject,
    createThreat,
} from "#test-utils/builders.ts";
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

const LocationProbe = () => <div data-testid="location">{useLocation().pathname}</div>;

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

    it("creates a new impact for the picked measure, notifies the host page and goes back", async () => {
        vi.spyOn(MeasureImpactsApi, "createMeasureImpact").mockResolvedValue(
            createMeasureImpact({ id: 9, measureId: 5, threatId: 42, projectId: 7 })
        );
        const onApplied = vi.fn();
        const user = userEvent.setup();
        renderWithProviders(
            <>
                <MeasureImpactByMeasureDialog
                    project={project}
                    threat={{ ...threat, damage: 4 }}
                    measureImpact={null}
                    onApplied={onApplied}
                />
                <LocationProbe />
            </>,
            { initialEntries: ["/projects/7/threats", "/projects/7/threats/measureImpacts/edit"] }
        );

        await user.click(screen.getByRole("combobox", { name: "Measure" }));
        await user.click(await screen.findByRole("option", { name: "Encrypt traffic" }));
        await user.type(screen.getByLabelText("Description"), "New");
        await user.click(screen.getByRole("button", { name: "Save" }));

        await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent(/^\/projects\/7\/threats$/));
        expect(MeasureImpactsApi.createMeasureImpact).toHaveBeenCalledWith(
            expect.objectContaining({ measureId: 5, threatId: 42, projectId: 7, description: "New" })
        );
        expect(onApplied).toHaveBeenCalledTimes(1);
    });

    it("disables Save while the save is running, so a second click can't save again", async () => {
        const measureImpact = createMeasureImpact({ id: 9, measureId: 5, threatId: 42, projectId: 7 });
        let resolveSave!: (value: MeasureImpact) => void;
        vi.spyOn(MeasureImpactsApi, "updateMeasureImpact").mockReturnValueOnce(
            new Promise((resolve) => {
                resolveSave = resolve;
            })
        );
        const user = userEvent.setup();
        renderWithProviders(
            <MeasureImpactByMeasureDialog
                project={project}
                threat={{ ...threat, damage: 4 }}
                measureImpact={measureImpact}
            />
        );

        const saveButton = screen.getByRole("button", { name: "Save" });
        await user.click(saveButton);

        await waitFor(() => expect(saveButton).toBeDisabled());
        expect(MeasureImpactsApi.updateMeasureImpact).toHaveBeenCalledTimes(1);

        resolveSave(measureImpact);
        await waitFor(() => expect(saveButton).toBeEnabled());
    });
});
