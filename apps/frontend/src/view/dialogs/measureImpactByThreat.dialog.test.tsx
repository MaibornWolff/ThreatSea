import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router";
import { GenericThreatsAPI } from "#api/generic-threats.api.ts";
import { MeasureImpactsApi } from "#api/measureImpacts.api.ts";
import { MeasuresAPI } from "#api/measures.api.ts";
import {
    createGenericThreatWithThreats,
    createMeasure,
    createMeasureImpact,
    createProject,
    createThreat,
} from "#test-utils/builders.ts";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import MeasureImpactByThreatDialog from "./measureImpactByThreat.dialog";

const project = createProject({ id: 7 });
const measure = createMeasure({ id: 3, projectId: 7, name: "Encrypt traffic" });
const threat = createThreat({ id: 42, projectId: 7, name: "Eavesdropping" });
const measureImpact = createMeasureImpact({ id: 5, measureId: 3, threatId: 42, projectId: 7, description: "Old" });

// Spy on the real modules instead of vi.mock (see AGENTS.md). The dialog loads threats, measures
// and measure impacts on mount; restoreMocks removes spies after every test.
beforeEach(() => {
    vi.spyOn(GenericThreatsAPI, "getGenericThreatsWithExtendedThreats").mockResolvedValue([
        createGenericThreatWithThreats({ threats: [threat] }),
    ]);
    vi.spyOn(MeasuresAPI, "getMeasures").mockResolvedValue([measure]);
    vi.spyOn(MeasureImpactsApi, "getMeasureImpacts").mockResolvedValue([measureImpact]);
    vi.spyOn(MeasureImpactsApi, "updateMeasureImpact").mockResolvedValue(measureImpact);
});

const DIALOG_URL = "/projects/7/measures/3/measureImpacts/edit";

const LocationProbe = () => <div data-testid="location">{useLocation().pathname}</div>;

const setup = (onSaved?: () => void) => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(
        <>
            <Routes>
                <Route
                    path="/projects/:projectId/measures/:measureId/measureImpacts/edit"
                    element={
                        <MeasureImpactByThreatDialog
                            project={project}
                            measure={measure}
                            measureImpact={measureImpact}
                            {...(onSaved !== undefined ? { onSaved } : {})}
                        />
                    }
                />
                <Route path="*" element={null} />
            </Routes>
            <LocationProbe />
        </>,
        { initialEntries: ["/projects/7/measures", DIALOG_URL] }
    );
    return { user, store };
};

const editDescription = async (user: ReturnType<typeof userEvent.setup>) => {
    const description = screen.getByLabelText("Description");
    await user.clear(description);
    await user.type(description, "New");
};

describe("MeasureImpactByThreatDialog", () => {
    it("shows the impact's threat preselected and locked when editing", async () => {
        setup();

        const threatSelect = screen.getByRole("combobox");
        expect(await within(threatSelect).findByText(/Eavesdropping/)).toBeInTheDocument();
        expect(threatSelect).toHaveAttribute("aria-disabled", "true");
    });

    it("saves the impact, notifies the host page and goes back", async () => {
        const onSaved = vi.fn();
        const { user } = setup(onSaved);

        await editDescription(user);
        await user.click(screen.getByRole("button", { name: "Save" }));

        await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent(/^\/projects\/7\/measures$/));
        expect(MeasureImpactsApi.updateMeasureImpact).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 5,
                measureId: 3,
                threatId: 42,
                projectId: 7,
                description: "New",
                probability: null,
                damage: null,
            })
        );
        expect(onSaved).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole("heading", { name: "Encrypt traffic" })).not.toBeInTheDocument();
    });

    it("keeps the dialog open and does not notify the host page when the save fails", async () => {
        vi.mocked(MeasureImpactsApi.updateMeasureImpact).mockRejectedValue(new Error("network"));
        const onSaved = vi.fn();
        const { user, store } = setup(onSaved);

        await editDescription(user);
        await user.click(screen.getByRole("button", { name: "Save" }));

        await waitFor(() => expect(store.getState().alert.text).toBe("Failed to save Measure Impact"));
        expect(screen.getByTestId("location")).toHaveTextContent(DIALOG_URL);
        expect(screen.getByRole("heading", { name: "Encrypt traffic" })).toBeInTheDocument();
        expect(onSaved).not.toHaveBeenCalled();
    });
});
