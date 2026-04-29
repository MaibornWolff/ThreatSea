import { describe, it, expect } from "vitest";
import systemReducer from "./system.reducer";
import { SystemActions } from "../actions/system.actions";

const getInitialState = () => systemReducer(undefined, { type: "@@INIT" });

describe("systemReducer", () => {
    describe("initial state", () => {
        it("has loadedProjectId set to null", () => {
            expect(getInitialState().loadedProjectId).toBeNull();
        });
    });

    describe("setLoadedProjectId", () => {
        it("stores a numeric project id", () => {
            const next = systemReducer(getInitialState(), SystemActions.setLoadedProjectId(7));
            expect(next.loadedProjectId).toBe(7);
        });

        it("clears the value when dispatched with null", () => {
            const seeded = systemReducer(getInitialState(), SystemActions.setLoadedProjectId(7));
            const next = systemReducer(seeded, SystemActions.setLoadedProjectId(null));
            expect(next.loadedProjectId).toBeNull();
        });
    });
});
