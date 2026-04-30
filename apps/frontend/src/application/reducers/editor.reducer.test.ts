import editorReducer from "./editor.reducer";
import { EditorActions } from "../actions/editor.actions";

const getInitialState = () => editorReducer(undefined, { type: "@@INIT" });

describe("editorReducer", () => {
    describe("initial state", () => {
        it("has lastCenteredProjectId set to null", () => {
            expect(getInitialState().lastCenteredProjectId).toBeNull();
        });

        it("has isCapturing set to false", () => {
            expect(getInitialState().isCapturing).toBe(false);
        });
    });

    describe("setLastCenteredProjectId", () => {
        it("stores a numeric project id", () => {
            const next = editorReducer(getInitialState(), EditorActions.setLastCenteredProjectId(42));
            expect(next.lastCenteredProjectId).toBe(42);
        });

        it("clears the value when dispatched with null", () => {
            const seeded = editorReducer(getInitialState(), EditorActions.setLastCenteredProjectId(42));
            const next = editorReducer(seeded, EditorActions.setLastCenteredProjectId(null));
            expect(next.lastCenteredProjectId).toBeNull();
        });
    });

    describe("setIsCapturing", () => {
        it("toggles isCapturing to true", () => {
            const next = editorReducer(getInitialState(), EditorActions.setIsCapturing(true));
            expect(next.isCapturing).toBe(true);
        });

        it("toggles isCapturing back to false", () => {
            const seeded = editorReducer(getInitialState(), EditorActions.setIsCapturing(true));
            const next = editorReducer(seeded, EditorActions.setIsCapturing(false));
            expect(next.isCapturing).toBe(false);
        });
    });
});
