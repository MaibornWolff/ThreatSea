import { CatalogThreatsActions } from "#application/actions/catalog-threats.actions.ts";
import { CatalogThreatsApi } from "#api/catalog-threats.api.ts";
import { createStore } from "#application/store.ts";
import { createCatalogThreat } from "#test-utils/builders.ts";

function createApiError(type: string, message: string): Error {
    const error = new Error(`${type}: ${message}`);
    error.name = type;
    return error;
}

describe("catalog-threats.middleware", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("explains that a catalog threat used in a project cannot be deleted", async () => {
        vi.spyOn(CatalogThreatsApi, "deleteCatalogThreat").mockRejectedValue(
            createApiError("Conflict", "Catalog threat is used in a project and cannot be deleted")
        );
        const store = createStore();

        store.dispatch(CatalogThreatsActions.deleteCatalogThreat(createCatalogThreat({ name: "Phishing" })));

        await vi.waitFor(() => expect(store.getState().alert.visible).toBe(true));
        expect(store.getState().alert).toMatchObject({
            type: "error",
            text: "Catalog Threat 'Phishing' is used in at least one project and cannot be deleted.",
        });
    });

    it("shows the generic error when deleting a catalog threat fails for another reason", async () => {
        vi.spyOn(CatalogThreatsApi, "deleteCatalogThreat").mockRejectedValue(
            createApiError("ServerError", "Internal Server Error")
        );
        const store = createStore();

        store.dispatch(CatalogThreatsActions.deleteCatalogThreat(createCatalogThreat({ name: "Phishing" })));

        await vi.waitFor(() => expect(store.getState().alert.visible).toBe(true));
        expect(store.getState().alert).toMatchObject({
            type: "error",
            text: "Failed to delete Catalog Threat 'Phishing'.",
        });
    });
});
