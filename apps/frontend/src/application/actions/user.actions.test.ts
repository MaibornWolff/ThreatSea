import { configureStore } from "@reduxjs/toolkit";
import { UserActions } from "#application/actions/user.actions.ts";
import { userReducer } from "#application/reducers/user.reducer.ts";
import { LoginAPI } from "#api/login.api.ts";

const loggedInStatus = { status: { isLoggedIn: true } };
const loggedOutStatus = { status: { isLoggedIn: false } };

const makeStore = () => configureStore({ reducer: { user: userReducer } });

describe("UserActions.getAuthStatus", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("returns the auth status without retrying when the first request succeeds", async () => {
        const getStatus = vi.spyOn(LoginAPI, "getAuthenticationStatus").mockResolvedValue(loggedInStatus);
        const store = makeStore();

        const dispatched = store.dispatch(UserActions.getAuthStatus());
        await vi.runAllTimersAsync();
        const action = await dispatched;

        expect(getStatus).toHaveBeenCalledTimes(1);
        expect(UserActions.getAuthStatus.fulfilled.match(action)).toBe(true);
        expect(store.getState().user.status.isLoggedIn).toBe(true);
    });

    it("does not retry a genuine logged-out response (HTTP 200)", async () => {
        const getStatus = vi.spyOn(LoginAPI, "getAuthenticationStatus").mockResolvedValue(loggedOutStatus);
        const store = makeStore();

        const dispatched = store.dispatch(UserActions.getAuthStatus());
        await vi.runAllTimersAsync();
        const action = await dispatched;

        expect(getStatus).toHaveBeenCalledTimes(1);
        expect(UserActions.getAuthStatus.fulfilled.match(action)).toBe(true);
        expect(store.getState().user.status.isLoggedIn).toBe(false);
    });

    it("retries and resolves when a transient failure precedes success", async () => {
        const getStatus = vi
            .spyOn(LoginAPI, "getAuthenticationStatus")
            .mockRejectedValueOnce(new Error("network blip"))
            .mockResolvedValue(loggedInStatus);
        const store = makeStore();

        const dispatched = store.dispatch(UserActions.getAuthStatus());
        await vi.runAllTimersAsync();
        const action = await dispatched;

        expect(getStatus).toHaveBeenCalledTimes(2);
        expect(UserActions.getAuthStatus.fulfilled.match(action)).toBe(true);
        expect(store.getState().user.status.isLoggedIn).toBe(true);
    });

    it("rejects only after exhausting all retry attempts", async () => {
        const getStatus = vi
            .spyOn(LoginAPI, "getAuthenticationStatus")
            .mockRejectedValue(new Error("backend unreachable"));
        const store = makeStore();

        const dispatched = store.dispatch(UserActions.getAuthStatus());
        await vi.runAllTimersAsync();
        const action = await dispatched;

        expect(getStatus).toHaveBeenCalledTimes(3);
        expect(UserActions.getAuthStatus.rejected.match(action)).toBe(true);
        expect(store.getState().user.isPending).toBe(false);
    });
});
