import systemReducer from "./system.reducer";
import { SystemActions } from "../actions/system.actions";
import { createAnnotation } from "#test-utils/builders.ts";

const getInitialState = () => systemReducer(undefined, { type: "@@INIT" });

describe("systemReducer", () => {
    describe("initial state", () => {
        it("has loadedProjectId set to null", () => {
            expect(getInitialState().loadedProjectId).toBeNull();
        });

        it("has empty annotations entity state", () => {
            expect(getInitialState().annotations.ids).toEqual([]);
            expect(getInitialState().annotations.entities).toEqual({});
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

    describe("createAnnotation", () => {
        it("adds an annotation to the entity state", () => {
            const annotation = createAnnotation();
            const next = systemReducer(getInitialState(), SystemActions.createAnnotation(annotation));

            expect(next.annotations.ids).toEqual(["ann-1"]);
            expect(next.annotations.entities["ann-1"]).toEqual(annotation);
        });

        it("marks the system as changed and blocks auto-save", () => {
            const next = systemReducer(getInitialState(), SystemActions.createAnnotation(createAnnotation()));

            expect(next.hasChanged).toBe(true);
            expect(next.blockAutoSave).toBe(true);
        });

        it("preserves existing annotations when adding a new one", () => {
            const seeded = systemReducer(
                getInitialState(),
                SystemActions.createAnnotation(createAnnotation({ id: "ann-1" }))
            );
            const next = systemReducer(seeded, SystemActions.createAnnotation(createAnnotation({ id: "ann-2" })));

            expect(next.annotations.ids).toEqual(["ann-1", "ann-2"]);
        });
    });

    describe("setAnnotation", () => {
        it("updates an existing annotation with the provided changes", () => {
            const seeded = systemReducer(
                getInitialState(),
                SystemActions.createAnnotation(createAnnotation({ stroke: "#000000" }))
            );
            const next = systemReducer(
                seeded,
                SystemActions.setAnnotation({ id: "ann-1", changes: { stroke: "#ff0000" } })
            );

            expect(next.annotations.entities["ann-1"]?.stroke).toBe("#ff0000");
            expect(next.annotations.entities["ann-1"]?.x).toBe(0);
        });

        it("marks the system as changed and blocks auto-save", () => {
            const seeded = systemReducer(getInitialState(), SystemActions.createAnnotation(createAnnotation()));
            const fresh = { ...seeded, hasChanged: false, blockAutoSave: false };
            const next = systemReducer(fresh, SystemActions.setAnnotation({ id: "ann-1", changes: { x: 99 } }));

            expect(next.hasChanged).toBe(true);
            expect(next.blockAutoSave).toBe(true);
        });

        it("is a no-op for an unknown id", () => {
            const next = systemReducer(
                getInitialState(),
                SystemActions.setAnnotation({ id: "missing", changes: { stroke: "#fff" } })
            );

            expect(next.annotations.ids).toEqual([]);
        });
    });

    describe("removeAnnotation", () => {
        it("removes the annotation by id", () => {
            const seeded = systemReducer(getInitialState(), SystemActions.createAnnotation(createAnnotation()));
            const next = systemReducer(seeded, SystemActions.removeAnnotation({ id: "ann-1" }));

            expect(next.annotations.ids).toEqual([]);
            expect(next.annotations.entities["ann-1"]).toBeUndefined();
        });

        it("marks the system as changed and blocks auto-save", () => {
            const seeded = systemReducer(getInitialState(), SystemActions.createAnnotation(createAnnotation()));
            const fresh = { ...seeded, hasChanged: false, blockAutoSave: false };
            const next = systemReducer(fresh, SystemActions.removeAnnotation({ id: "ann-1" }));

            expect(next.hasChanged).toBe(true);
            expect(next.blockAutoSave).toBe(true);
        });

        it("leaves other annotations intact", () => {
            let state = systemReducer(
                getInitialState(),
                SystemActions.createAnnotation(createAnnotation({ id: "ann-1" }))
            );
            state = systemReducer(state, SystemActions.createAnnotation(createAnnotation({ id: "ann-2" })));

            const next = systemReducer(state, SystemActions.removeAnnotation({ id: "ann-1" }));

            expect(next.annotations.ids).toEqual(["ann-2"]);
        });
    });

    describe("setAnnotations", () => {
        it("hydrates the entity state with the provided annotations", () => {
            const annotations = [
                createAnnotation({ id: "ann-1" }),
                createAnnotation({ id: "ann-2", type: "circle", radius: 25 }),
            ];

            const next = systemReducer(getInitialState(), SystemActions.setAnnotations(annotations));

            expect(next.annotations.ids).toEqual(["ann-1", "ann-2"]);
            expect(next.annotations.entities["ann-2"]?.type).toBe("circle");
        });

        it("upserts: existing entries are updated and new ones are appended", () => {
            const seeded = systemReducer(
                getInitialState(),
                SystemActions.createAnnotation(createAnnotation({ id: "ann-1", stroke: "#000" }))
            );

            const next = systemReducer(
                seeded,
                SystemActions.setAnnotations([
                    createAnnotation({ id: "ann-1", stroke: "#fff" }),
                    createAnnotation({ id: "ann-2" }),
                ])
            );

            expect(next.annotations.entities["ann-1"]?.stroke).toBe("#fff");
            expect(next.annotations.entities["ann-2"]).toBeDefined();
        });

        it("does not mark the system as changed (load-path setter, not a user edit)", () => {
            const fresh = { ...getInitialState(), hasChanged: false, blockAutoSave: false };
            const next = systemReducer(fresh, SystemActions.setAnnotations([createAnnotation()]));

            expect(next.hasChanged).toBe(false);
            expect(next.blockAutoSave).toBe(false);
        });

        it("accepts an empty array (used for legacy load fallback)", () => {
            const seeded = systemReducer(getInitialState(), SystemActions.createAnnotation(createAnnotation()));
            const next = systemReducer(seeded, SystemActions.setAnnotations([]));

            expect(next.annotations.ids).toEqual(["ann-1"]);
        });
    });

    describe("clearSystem", () => {
        it("resets annotations back to empty", () => {
            const seeded = systemReducer(getInitialState(), SystemActions.createAnnotation(createAnnotation()));
            const next = systemReducer(seeded, SystemActions.clearSystem());

            expect(next.annotations.ids).toEqual([]);
        });

        it("clears all per-project default colors", () => {
            const seeded = systemReducer(
                getInitialState(),
                SystemActions.setDefaultAnnotationColor({ projectId: 1, color: "#123456" })
            );
            const next = systemReducer(seeded, SystemActions.clearSystem());

            expect(next.defaultAnnotationColorByProject).toEqual({});
        });
    });

    describe("setDefaultAnnotationColor", () => {
        it("stores the chosen color under the given projectId, keeping other projects untouched", () => {
            const seeded = systemReducer(
                getInitialState(),
                SystemActions.setDefaultAnnotationColor({ projectId: 1, color: "#aaaaaa" })
            );
            const next = systemReducer(
                seeded,
                SystemActions.setDefaultAnnotationColor({ projectId: 2, color: "#bbbbbb" })
            );

            expect(next.defaultAnnotationColorByProject).toEqual({ 1: "#aaaaaa", 2: "#bbbbbb" });
        });

        it("marks the system as changed and unblocks auto-save so it kicks off shortly after", () => {
            const next = systemReducer(
                getInitialState(),
                SystemActions.setDefaultAnnotationColor({ projectId: 1, color: "#abcdef" })
            );

            expect(next.hasChanged).toBe(true);
            expect(next.blockAutoSave).toBe(true);
        });
    });

    describe("setDefaultAnnotationColorFromBackend", () => {
        it("stores the loaded color under the given projectId without flipping change/auto-save flags", () => {
            const fresh = { ...getInitialState(), hasChanged: false, blockAutoSave: false };
            const next = systemReducer(
                fresh,
                SystemActions.setDefaultAnnotationColorFromBackend({ projectId: 1, color: "#abcdef" })
            );

            expect(next.defaultAnnotationColorByProject).toEqual({ 1: "#abcdef" });
            expect(next.hasChanged).toBe(false);
            expect(next.blockAutoSave).toBe(false);
        });

        it("removes the entry when the loaded value is null (project has never been customized)", () => {
            const seeded = systemReducer(
                getInitialState(),
                SystemActions.setDefaultAnnotationColor({ projectId: 1, color: "#abcdef" })
            );
            const next = systemReducer(
                seeded,
                SystemActions.setDefaultAnnotationColorFromBackend({ projectId: 1, color: null })
            );

            expect(next.defaultAnnotationColorByProject).toEqual({});
        });

        it("never touches other projects' entries", () => {
            const seeded = systemReducer(
                getInitialState(),
                SystemActions.setDefaultAnnotationColor({ projectId: 1, color: "#aaaaaa" })
            );
            const next = systemReducer(
                seeded,
                SystemActions.setDefaultAnnotationColorFromBackend({ projectId: 2, color: "#bbbbbb" })
            );

            expect(next.defaultAnnotationColorByProject).toEqual({ 1: "#aaaaaa", 2: "#bbbbbb" });
        });
    });
});
