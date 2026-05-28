import { editorSelectors } from "./editor.selectors";
import editorReducer from "../reducers/editor.reducer";
import { EditorActions } from "../actions/editor.actions";
import type { RootState } from "../store.types";
import type { AnnotationType } from "#api/types/system.types.ts";

const withEditor = (mutate?: (editor: ReturnType<typeof editorReducer>) => ReturnType<typeof editorReducer>) => {
    const base = editorReducer(undefined, { type: "@@INIT" });
    return { editor: mutate ? mutate(base) : base } as RootState;
};

describe("editorSelectors", () => {
    describe("selectSelectedAnnotation", () => {
        it("returns null in the initial state", () => {
            expect(editorSelectors.selectSelectedAnnotation(withEditor())).toBeNull();
        });

        it("returns the id after selectAnnotation is dispatched", () => {
            const state = withEditor((editor) => editorReducer(editor, EditorActions.selectAnnotation("ann-1")));

            expect(editorSelectors.selectSelectedAnnotation(state)).toBe("ann-1");
        });

        it("returns null after deselectAnnotation is dispatched", () => {
            const state = withEditor((editor) => {
                const seeded = editorReducer(editor, EditorActions.selectAnnotation("ann-1"));
                return editorReducer(seeded, EditorActions.deselectAnnotation());
            });

            expect(editorSelectors.selectSelectedAnnotation(state)).toBeNull();
        });
    });

    describe("selectAnnotationTool", () => {
        it("returns null in the initial state", () => {
            expect(editorSelectors.selectAnnotationTool(withEditor())).toBeNull();
        });

        it.each<AnnotationType>(["rect", "circle", "line", "arrow"])(
            "returns %s after setAnnotationTool is dispatched with that tool",
            (tool) => {
                const state = withEditor((editor) => editorReducer(editor, EditorActions.setAnnotationTool(tool)));

                expect(editorSelectors.selectAnnotationTool(state)).toBe(tool);
            }
        );

        it("returns null after setAnnotationTool is dispatched with null", () => {
            const state = withEditor((editor) => {
                const seeded = editorReducer(editor, EditorActions.setAnnotationTool("rect"));
                return editorReducer(seeded, EditorActions.setAnnotationTool(null));
            });

            expect(editorSelectors.selectAnnotationTool(state)).toBeNull();
        });
    });
});
