import editorReducer from "./editor.reducer";
import { EditorActions } from "#application/actions/editor.actions.ts";
import { SystemActions } from "#application/actions/system.actions.ts";
import { AnchorOrientation } from "#api/types/system.types.ts";
import { STANDARD_COMPONENT_TYPES } from "#api/types/standard-component.types.ts";
import { STANDARD_ICON_IMAGES } from "#view/icons/standard-icons.ts";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import type { EditorComponentType } from "#application/adapters/editor-component-type.adapter.ts";
import type { ComponentType } from "#api/types/component-types.types.ts";

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

    describe("annotation selection", () => {
        it("starts with selectedAnnotation set to null", () => {
            expect(getInitialState().selectedAnnotation).toBeNull();
        });

        it("selectAnnotation stores the provided id", () => {
            const next = editorReducer(getInitialState(), EditorActions.selectAnnotation("ann-1"));
            expect(next.selectedAnnotation).toBe("ann-1");
        });

        it("deselectAnnotation clears the selection", () => {
            const seeded = editorReducer(getInitialState(), EditorActions.selectAnnotation("ann-1"));
            const next = editorReducer(seeded, EditorActions.deselectAnnotation());
            expect(next.selectedAnnotation).toBeNull();
        });

        it("selectAnnotation replaces a previously selected id", () => {
            const seeded = editorReducer(getInitialState(), EditorActions.selectAnnotation("ann-1"));
            const next = editorReducer(seeded, EditorActions.selectAnnotation("ann-2"));
            expect(next.selectedAnnotation).toBe("ann-2");
        });
    });

    describe("annotationTool", () => {
        it("starts with annotationTool set to null", () => {
            expect(getInitialState().annotationTool).toBeNull();
        });

        it("setAnnotationTool stores the provided tool", () => {
            const next = editorReducer(getInitialState(), EditorActions.setAnnotationTool("rect"));
            expect(next.annotationTool).toBe("rect");
        });

        it("setAnnotationTool with null clears the active tool", () => {
            const seeded = editorReducer(getInitialState(), EditorActions.setAnnotationTool("circle"));
            const next = editorReducer(seeded, EditorActions.setAnnotationTool(null));
            expect(next.annotationTool).toBeNull();
        });

        it("setAnnotationTool replaces the previous tool", () => {
            const seeded = editorReducer(getInitialState(), EditorActions.setAnnotationTool("line"));
            const next = editorReducer(seeded, EditorActions.setAnnotationTool("arrow"));
            expect(next.annotationTool).toBe("arrow");
        });
    });

    describe("setLoadedProjectId", () => {
        it("clears the active annotation tool", () => {
            const seeded = editorReducer(getInitialState(), EditorActions.setAnnotationTool("rect"));
            const next = editorReducer(seeded, SystemActions.setLoadedProjectId(7));
            expect(next.annotationTool).toBeNull();
        });

        it("clears the selected annotation so a stale id from the previous project cannot leak", () => {
            const seeded = editorReducer(getInitialState(), EditorActions.selectAnnotation("ann-from-project-a"));
            const next = editorReducer(seeded, SystemActions.setLoadedProjectId(7));
            expect(next.selectedAnnotation).toBeNull();
        });
    });

    describe("custom component type icon resolution", () => {
        const baseCustom: EditorComponentType = {
            id: 42,
            name: "My Custom",
            symbol: null,
            standardIcon: null,
            pointsOfAttack: [POINTS_OF_ATTACK.USER_INTERFACE],
            projectId: 1,
        };

        const apiComponent = (overrides: Partial<ComponentType>): ComponentType => ({
            id: 1,
            name: "My Custom",
            symbol: null,
            standardIcon: null,
            pointsOfAttack: [POINTS_OF_ATTACK.USER_INTERFACE],
            projectId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides,
        });

        it("getComponentTypes.fulfilled replaces symbol with the standard icon image when only standardIcon is set", () => {
            const payload: ComponentType[] = [apiComponent({ id: 1, standardIcon: STANDARD_COMPONENT_TYPES.CLIENT })];
            const next = editorReducer(
                getInitialState(),
                EditorActions.getComponentTypes.fulfilled(payload, "req-id", { projectId: 1 })
            );
            const stored = next.componentTypes.entities[1];
            expect(stored?.symbol).toBe(STANDARD_ICON_IMAGES[STANDARD_COMPONENT_TYPES.CLIENT]);
            expect(stored?.standardIcon).toBe(STANDARD_COMPONENT_TYPES.CLIENT);
        });

        it("getComponentTypes.fulfilled keeps an uploaded symbol untouched when standardIcon is null", () => {
            const payload: ComponentType[] = [
                apiComponent({ id: 2, symbol: "data:image/png;base64,AAAA", standardIcon: null }),
            ];
            const next = editorReducer(
                getInitialState(),
                EditorActions.getComponentTypes.fulfilled(payload, "req-id", { projectId: 1 })
            );
            expect(next.componentTypes.entities[2]?.symbol).toBe("data:image/png;base64,AAAA");
        });

        it("addComponentType resolves standardIcon to an image url", () => {
            const next = editorReducer(
                getInitialState(),
                EditorActions.addComponentType({
                    ...baseCustom,
                    id: 3,
                    standardIcon: STANDARD_COMPONENT_TYPES.SERVER,
                })
            );
            expect(next.componentTypes.entities[3]?.symbol).toBe(STANDARD_ICON_IMAGES[STANDARD_COMPONENT_TYPES.SERVER]);
        });

        it("addComponentType leaves symbol null when both fields are null", () => {
            const next = editorReducer(getInitialState(), EditorActions.addComponentType({ ...baseCustom, id: 4 }));
            expect(next.componentTypes.entities[4]?.symbol).toBeNull();
        });

        it("setComponentType resolves standardIcon on update", () => {
            const seeded = editorReducer(getInitialState(), EditorActions.addComponentType({ ...baseCustom, id: 5 }));
            const next = editorReducer(
                seeded,
                EditorActions.setComponentType({
                    id: 5,
                    changes: { standardIcon: STANDARD_COMPONENT_TYPES.DATABASE, symbol: null },
                })
            );
            expect(next.componentTypes.entities[5]?.symbol).toBe(
                STANDARD_ICON_IMAGES[STANDARD_COMPONENT_TYPES.DATABASE]
            );
        });

        it("setComponentType does not overwrite an existing symbol when changes only carry an unrelated field", () => {
            const seeded = editorReducer(
                getInitialState(),
                EditorActions.addComponentType({
                    ...baseCustom,
                    id: 6,
                    symbol: "data:image/png;base64,BBBB",
                })
            );
            const next = editorReducer(seeded, EditorActions.setComponentType({ id: 6, changes: { name: "Renamed" } }));
            expect(next.componentTypes.entities[6]?.symbol).toBe("data:image/png;base64,BBBB");
            expect(next.componentTypes.entities[6]?.name).toBe("Renamed");
        });
    });

    describe("select actions exit drawing mode", () => {
        const selectActions = [
            ["selectComponent", EditorActions.selectComponent("component-1")],
            ["selectConnection", EditorActions.selectConnection("connection-1")],
            ["selectPointOfAttack", EditorActions.selectPointOfAttack("poa-1")],
            ["selectConnectionPoint", EditorActions.selectConnectionPoint("cp-1")],
            [
                "setConnection",
                EditorActions.setConnection({
                    from: { id: "component-1", anchor: AnchorOrientation.top, type: STANDARD_COMPONENT_TYPES.CLIENT },
                }),
            ],
            ["selectAnnotation", EditorActions.selectAnnotation("ann-1")],
        ] as const;

        it.each(selectActions)("%s clears the active annotation tool", (_name, action) => {
            const seeded = editorReducer(getInitialState(), EditorActions.setAnnotationTool("rect"));
            const next = editorReducer(seeded, action);
            expect(next.annotationTool).toBeNull();
        });

        it.each(selectActions)("%s leaves annotationTool null when no tool was active", (_name, action) => {
            const next = editorReducer(getInitialState(), action);
            expect(next.annotationTool).toBeNull();
        });
    });
});
