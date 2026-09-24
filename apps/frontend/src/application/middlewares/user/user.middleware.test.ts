import { UserActions } from "#application/actions/user.actions.ts";
import { LoginAPI } from "#api/login.api.ts";
import { createStore } from "#application/store.ts";
import { tableViewStorageKey } from "#utils/table-view-storage.ts";

describe("user.middleware", () => {
    beforeEach(() => {
        sessionStorage.clear();
        sessionStorage.setItem(tableViewStorageKey("assets-column-widths-1"), JSON.stringify({ name: 320 }));
        sessionStorage.setItem(tableViewStorageKey("threats-column-visibility-1"), JSON.stringify({ name: false }));
        sessionStorage.setItem("unrelated-setting", "kept");
    });

    afterEach(() => {
        sessionStorage.clear();
    });

    describe("logging out", () => {
        it("clears every table view setting but keeps unrelated session data", async () => {
            vi.spyOn(LoginAPI, "logOut").mockResolvedValue(undefined);
            const store = createStore();

            store.dispatch(UserActions.logOut());

            await vi.waitFor(() => expect(store.getState().alert.text).toBe("Logged out successfully"));
            expect(sessionStorage.getItem(tableViewStorageKey("assets-column-widths-1"))).toBeNull();
            expect(sessionStorage.getItem(tableViewStorageKey("threats-column-visibility-1"))).toBeNull();
            expect(sessionStorage.getItem("unrelated-setting")).toBe("kept");
        });

        it("keeps the table view settings when the logout request fails", async () => {
            vi.spyOn(LoginAPI, "logOut").mockRejectedValue(new Error("network down"));
            const store = createStore();

            store.dispatch(UserActions.logOut());

            await vi.waitFor(() => expect(store.getState().alert.text).toBe("Logged out failed"));
            expect(sessionStorage.getItem(tableViewStorageKey("assets-column-widths-1"))).toBe(
                JSON.stringify({ name: 320 })
            );
            expect(sessionStorage.getItem(tableViewStorageKey("threats-column-visibility-1"))).toBe(
                JSON.stringify({ name: false })
            );
        });
    });
});
