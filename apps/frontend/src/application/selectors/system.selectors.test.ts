import { systemSelectors } from "./system.selectors";
import { systemAnnotationsAdapter } from "../adapters/system-annotations.adapter";
import systemReducer from "../reducers/system.reducer";
import { createAnnotation } from "#test-utils/builders.ts";
import type { RootState } from "../store.types";
import type { Annotation } from "#api/types/system.types.ts";

const withAnnotations = (annotations: Annotation[]) => {
    const baseSystem = systemReducer(undefined, { type: "@@INIT" });
    return {
        system: {
            ...baseSystem,
            annotations: systemAnnotationsAdapter.upsertMany(systemAnnotationsAdapter.getInitialState(), annotations),
        },
    } as RootState;
};

describe("systemSelectors", () => {
    describe("selectAnnotations", () => {
        it("returns annotations belonging to the requested project", () => {
            const state = withAnnotations([
                createAnnotation({ id: "ann-1", projectId: 1 }),
                createAnnotation({ id: "ann-2", projectId: 1 }),
                createAnnotation({ id: "ann-3", projectId: 99 }),
            ]);

            const result = systemSelectors.selectAnnotations(state, 1);

            expect(result.map((a) => a.id)).toEqual(["ann-1", "ann-2"]);
        });

        it("returns an empty array when no annotations match the project", () => {
            const state = withAnnotations([createAnnotation({ projectId: 99 })]);

            expect(systemSelectors.selectAnnotations(state, 1)).toEqual([]);
        });

        it("returns an empty array when projectId is null", () => {
            const state = withAnnotations([createAnnotation({ projectId: 1 })]);

            expect(systemSelectors.selectAnnotations(state, null)).toEqual([]);
        });

        it("returns an empty array when there are no annotations at all", () => {
            const state = withAnnotations([]);

            expect(systemSelectors.selectAnnotations(state, 1)).toEqual([]);
        });
    });

    describe("selectAnnotation", () => {
        it("returns the annotation when it exists", () => {
            const annotation = createAnnotation({ id: "ann-42", stroke: "#ff0000" });
            const state = withAnnotations([annotation]);

            expect(systemSelectors.selectAnnotation(state, "ann-42")).toEqual(annotation);
        });

        it("returns undefined when the id does not exist", () => {
            const state = withAnnotations([createAnnotation({ id: "ann-1" })]);

            expect(systemSelectors.selectAnnotation(state, "missing")).toBeUndefined();
        });

        it("returns undefined when the id is null", () => {
            const state = withAnnotations([createAnnotation({ id: "ann-1" })]);

            expect(systemSelectors.selectAnnotation(state, null)).toBeUndefined();
        });

        it("returns undefined when the id is undefined", () => {
            const state = withAnnotations([createAnnotation({ id: "ann-1" })]);

            expect(systemSelectors.selectAnnotation(state, undefined)).toBeUndefined();
        });
    });
});
