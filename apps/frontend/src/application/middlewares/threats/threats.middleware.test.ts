import { ThreatsActions } from "#application/actions/threats.actions.ts";
import { ThreatsAPI } from "#api/threats.api.ts";
import { createStore } from "#application/store.ts";
import { createThreat } from "#test-utils/builders.ts";

describe("threats.middleware", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("shows a success alert with the threat's name after creating a threat", async () => {
        vi.spyOn(ThreatsAPI, "createThreat").mockResolvedValue(createThreat({ id: 5, name: "Spoofed login" }));
        const store = createStore();

        store.dispatch(ThreatsActions.createThreat({ projectId: 1, genericThreatId: 2, name: "Spoofed login" }));

        await vi.waitFor(() => expect(store.getState().alert.visible).toBe(true));
        expect(store.getState().alert).toMatchObject({
            type: "success",
            text: "Threat 'Spoofed login' was saved successfully",
        });
    });

    it("shows a success alert with the threat's name after saving a threat", async () => {
        vi.spyOn(ThreatsAPI, "updateThreat").mockResolvedValue(createThreat({ id: 5, name: "Renamed threat" }));
        const store = createStore();

        store.dispatch(ThreatsActions.updateThreat({ id: 5, projectId: 1, name: "Renamed threat" }));

        await vi.waitFor(() => expect(store.getState().alert.visible).toBe(true));
        expect(store.getState().alert).toMatchObject({
            type: "success",
            text: "Threat 'Renamed threat' was saved successfully",
        });
    });

    it("shows a success alert with the threat's name after deleting a threat", async () => {
        vi.spyOn(ThreatsAPI, "deleteThreat").mockResolvedValue(undefined);
        const store = createStore();

        store.dispatch(ThreatsActions.deleteThreat({ id: 5, projectId: 1, name: "Old threat" }));

        await vi.waitFor(() => expect(store.getState().alert.visible).toBe(true));
        expect(store.getState().alert).toMatchObject({
            type: "success",
            text: "Threat 'Old threat' was deleted successfully",
        });
    });

    it("shows an error alert when saving a threat fails", async () => {
        vi.spyOn(ThreatsAPI, "updateThreat").mockRejectedValue(new Error("nope"));
        const store = createStore();

        store.dispatch(ThreatsActions.updateThreat({ id: 5, projectId: 1, name: "Renamed threat" }));

        await vi.waitFor(() => expect(store.getState().alert.visible).toBe(true));
        expect(store.getState().alert).toMatchObject({
            type: "error",
            text: "Failed to save Threat 'Renamed threat'",
        });
    });

    it("shows an error alert when deleting a threat fails", async () => {
        vi.spyOn(ThreatsAPI, "deleteThreat").mockRejectedValue(new Error("nope"));
        const store = createStore();

        store.dispatch(ThreatsActions.deleteThreat({ id: 5, projectId: 1, name: "Old threat" }));

        await vi.waitFor(() => expect(store.getState().alert.visible).toBe(true));
        expect(store.getState().alert).toMatchObject({
            type: "error",
            text: "Failed to delete Threat 'Old threat'",
        });
    });
});
