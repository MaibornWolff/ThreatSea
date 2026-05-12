import { renderHook, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { createRef, type ReactNode, type RefObject } from "react";
import type { KonvaEventObject, Node as KonvaNode } from "konva/lib/Node";
import type { Transformer as KonvaTransformer } from "konva/lib/shapes/Transformer";
import { useAnnotationInteraction } from "./use-annotation-interaction.hook";
import { createStore } from "../store";
import { EditorActions } from "../actions/editor.actions";
import type { Annotation } from "#api/types/system.types.ts";
import { createAnnotation } from "../../test-utils/builders";

const buildStageContent = () => {
    const content = { style: { cursor: "default" } };
    return content;
};

const buildEvent = (overrides: { button?: number; stageContent?: { style: { cursor: string } } } = {}) => {
    const stageContent = overrides.stageContent ?? buildStageContent();
    return {
        evt: { button: overrides.button ?? 0, preventDefault: vi.fn() },
        target: { getStage: () => ({ content: stageContent }) },
        cancelBubble: false,
    } as unknown as KonvaEventObject<MouseEvent>;
};

type OnSelectMock = (id: string, options?: { openSidebar?: boolean }) => void;

const renderInteractionHook = (params: {
    annotation?: Annotation;
    selected?: boolean;
    editable?: boolean;
    shapeRef?: RefObject<KonvaNode | null>;
    transformerRef?: RefObject<KonvaTransformer | null>;
    onSelect?: OnSelectMock;
}) => {
    const store = createStore();
    const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
    const onSelect = params.onSelect ?? vi.fn<OnSelectMock>();
    const hook = renderHook(
        () =>
            useAnnotationInteraction({
                annotation: params.annotation ?? createAnnotation(),
                selected: params.selected ?? false,
                editable: params.editable ?? true,
                shapeRef: params.shapeRef ?? createRef<KonvaNode | null>(),
                transformerRef: params.transformerRef ?? createRef<KonvaTransformer | null>(),
                onSelect,
            }),
        { wrapper }
    );
    return { hook, store, onSelect };
};

describe("useAnnotationInteraction", () => {
    describe("handleClick", () => {
        it("calls onSelect with the annotation id on a primary click", () => {
            const { hook, onSelect } = renderInteractionHook({});

            act(() => {
                hook.result.current.handleClick(buildEvent({ button: 0 }));
            });

            expect(onSelect).toHaveBeenCalledWith("ann-1");
        });

        it("ignores non-primary mouse buttons", () => {
            const { hook, onSelect } = renderInteractionHook({});

            act(() => {
                hook.result.current.handleClick(buildEvent({ button: 2 }));
            });

            expect(onSelect).not.toHaveBeenCalled();
        });

        it("cancels event bubbling and the default action on a primary click", () => {
            const { hook } = renderInteractionHook({});
            const event = buildEvent({ button: 0 });

            act(() => {
                hook.result.current.handleClick(event);
            });

            expect(event.cancelBubble).toBe(true);
            expect(event.evt.preventDefault).toHaveBeenCalled();
        });
    });

    describe("handleMouseEnter / handleMouseLeave", () => {
        it("sets the pointer cursor on enter when editable and no annotation tool is active", () => {
            const { hook } = renderInteractionHook({ editable: true });
            const event = buildEvent();

            act(() => {
                hook.result.current.handleMouseEnter(event);
            });

            expect(event.target.getStage()!.content.style.cursor).toBe("pointer");
        });

        it("does not change the cursor on enter when not editable", () => {
            const { hook } = renderInteractionHook({ editable: false });
            const stageContent = buildStageContent();
            stageContent.style.cursor = "default";

            act(() => {
                hook.result.current.handleMouseEnter(buildEvent({ stageContent }));
            });

            expect(stageContent.style.cursor).toBe("default");
        });

        it("does not change the cursor on enter while a drawing tool is active", () => {
            const { hook, store } = renderInteractionHook({ editable: true });
            const stageContent = buildStageContent();
            stageContent.style.cursor = "crosshair";

            act(() => {
                store.dispatch(EditorActions.setAnnotationTool("rect"));
            });

            act(() => {
                hook.result.current.handleMouseEnter(buildEvent({ stageContent }));
            });

            expect(stageContent.style.cursor).toBe("crosshair");
        });

        it("resets the cursor to default on leave when no annotation tool is active", () => {
            const { hook } = renderInteractionHook({});
            const stageContent = buildStageContent();
            stageContent.style.cursor = "pointer";

            act(() => {
                hook.result.current.handleMouseLeave(buildEvent({ stageContent }));
            });

            expect(stageContent.style.cursor).toBe("default");
        });

        it("does not reset the cursor on leave while a drawing tool is active", () => {
            const { hook, store } = renderInteractionHook({});
            const stageContent = buildStageContent();
            stageContent.style.cursor = "crosshair";

            act(() => {
                store.dispatch(EditorActions.setAnnotationTool("line"));
            });

            act(() => {
                hook.result.current.handleMouseLeave(buildEvent({ stageContent }));
            });

            expect(stageContent.style.cursor).toBe("crosshair");
        });
    });

    describe("setStageCursor", () => {
        it("writes the requested cursor to the stage content style", () => {
            const { hook } = renderInteractionHook({});
            const stageContent = buildStageContent();

            act(() => {
                hook.result.current.setStageCursor(buildEvent({ stageContent }), "move");
            });

            expect(stageContent.style.cursor).toBe("move");
        });
    });

    describe("transformer attachment effect", () => {
        it("attaches the shape to the transformer when selected and editable", () => {
            const shape = { id: "shape" } as unknown as KonvaNode;
            const batchDraw = vi.fn();
            const transformer = {
                nodes: vi.fn(),
                getLayer: () => ({ batchDraw }),
            } as unknown as KonvaTransformer;
            const shapeRef = { current: shape } as RefObject<KonvaNode | null>;
            const transformerRef = { current: transformer } as RefObject<KonvaTransformer | null>;

            renderInteractionHook({ selected: true, editable: true, shapeRef, transformerRef });

            expect(transformer.nodes).toHaveBeenCalledWith([shape]);
            expect(batchDraw).toHaveBeenCalled();
        });

        it("does not attach when not selected", () => {
            const transformer = {
                nodes: vi.fn(),
                getLayer: () => ({ batchDraw: vi.fn() }),
            } as unknown as KonvaTransformer;
            const shapeRef = { current: {} as KonvaNode } as RefObject<KonvaNode | null>;
            const transformerRef = { current: transformer } as RefObject<KonvaTransformer | null>;

            renderInteractionHook({ selected: false, editable: true, shapeRef, transformerRef });

            expect(transformer.nodes).not.toHaveBeenCalled();
        });

        it("does not attach when not editable even if selected", () => {
            const transformer = {
                nodes: vi.fn(),
                getLayer: () => ({ batchDraw: vi.fn() }),
            } as unknown as KonvaTransformer;
            const shapeRef = { current: {} as KonvaNode } as RefObject<KonvaNode | null>;
            const transformerRef = { current: transformer } as RefObject<KonvaTransformer | null>;

            renderInteractionHook({ selected: true, editable: false, shapeRef, transformerRef });

            expect(transformer.nodes).not.toHaveBeenCalled();
        });
    });

    describe("isCapturing", () => {
        it("reflects the editor isCapturing slice", () => {
            const { hook, store } = renderInteractionHook({});

            expect(hook.result.current.isCapturing).toBe(false);

            act(() => {
                store.dispatch(EditorActions.setIsCapturing(true));
            });

            expect(hook.result.current.isCapturing).toBe(true);
        });
    });
});
