import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import type { ReactNode, RefObject } from "react";
import type { Stage as KonvaStage } from "konva/lib/Stage";
import type { KonvaEventObject } from "konva/lib/Node";
import { useComponentPlacement } from "./use-component-placement.hook";
import { createStore } from "#application/store.ts";
import { EditorActions } from "#application/actions/editor.actions.ts";
import type { EditorComponentType } from "#application/adapters/editor-component-type.adapter.ts";
import type { Coordinate } from "#api/types/system.types.ts";

const paymentGatewayComponentType: EditorComponentType = {
    id: 42,
    name: "Payment Gateway",
    pointsOfAttack: [],
    symbol: null,
    standardIcon: null,
    isStandard: false,
    projectId: null,
};

const makeStage = (pointer: Coordinate | null) => {
    const content = { style: { cursor: "default" } };
    const stageRef = {
        current: { content, getRelativePointerPosition: () => pointer },
    } as unknown as RefObject<KonvaStage | null>;
    return { stageRef, content };
};

const makeClickEvent = (button = 0) =>
    ({
        evt: { button, preventDefault: vi.fn() },
    }) as unknown as KonvaEventObject<MouseEvent>;

const setup = (overrides: { pointer?: Coordinate | null; isEditor?: boolean } = {}) => {
    const store = createStore();
    const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
    const { stageRef, content } = makeStage(overrides.pointer === undefined ? { x: 120, y: 240 } : overrides.pointer);
    const onPlaceComponent = vi.fn<(componentType: EditorComponentType, position: Coordinate) => void>();
    const hook = renderHook(
        () => useComponentPlacement({ stageRef, isEditor: overrides.isEditor ?? true, onPlaceComponent }),
        { wrapper }
    );
    return { ...hook, store, content, onPlaceComponent };
};

describe("useComponentPlacement", () => {
    it("starts without a component waiting to be placed", () => {
        const { result } = setup();

        expect(result.current.componentTypeToPlace).toBeNull();
    });

    it("keeps the picked component type until it is placed", () => {
        const { result } = setup();

        act(() => result.current.setComponentTypeToPlace(paymentGatewayComponentType));

        expect(result.current.componentTypeToPlace).toEqual(paymentGatewayComponentType);
    });

    it("places the pending component at the pointer on a left click and ends the placement", () => {
        const { result, onPlaceComponent } = setup({ pointer: { x: 120, y: 240 } });
        act(() => result.current.setComponentTypeToPlace(paymentGatewayComponentType));

        let placed: boolean | undefined;
        act(() => {
            placed = result.current.tryPlaceComponent(makeClickEvent());
        });

        expect(placed).toBe(true);
        expect(onPlaceComponent).toHaveBeenCalledWith(paymentGatewayComponentType, { x: 120, y: 240 });
        expect(result.current.componentTypeToPlace).toBeNull();
    });

    it("places only once — a second click does nothing", () => {
        const { result, onPlaceComponent } = setup();
        act(() => result.current.setComponentTypeToPlace(paymentGatewayComponentType));
        act(() => {
            result.current.tryPlaceComponent(makeClickEvent());
        });

        let placedAgain: boolean | undefined;
        act(() => {
            placedAgain = result.current.tryPlaceComponent(makeClickEvent());
        });

        expect(placedAgain).toBe(false);
        expect(onPlaceComponent).toHaveBeenCalledTimes(1);
    });

    it("ignores clicks while no component is pending", () => {
        const { result, onPlaceComponent } = setup();

        let placed: boolean | undefined;
        act(() => {
            placed = result.current.tryPlaceComponent(makeClickEvent());
        });

        expect(placed).toBe(false);
        expect(onPlaceComponent).not.toHaveBeenCalled();
    });

    it("ignores clicks with a button other than the primary one", () => {
        const { result, onPlaceComponent } = setup();
        act(() => result.current.setComponentTypeToPlace(paymentGatewayComponentType));

        act(() => {
            result.current.tryPlaceComponent(makeClickEvent(2));
        });

        expect(onPlaceComponent).not.toHaveBeenCalled();
        expect(result.current.componentTypeToPlace).toEqual(paymentGatewayComponentType);
    });

    it("does not place for users without editor rights", () => {
        const { result, onPlaceComponent } = setup({ isEditor: false });
        act(() => result.current.setComponentTypeToPlace(paymentGatewayComponentType));

        act(() => {
            result.current.tryPlaceComponent(makeClickEvent());
        });

        expect(onPlaceComponent).not.toHaveBeenCalled();
    });

    it("keeps the placement pending when the pointer position is unavailable", () => {
        const { result, onPlaceComponent } = setup({ pointer: null });
        act(() => result.current.setComponentTypeToPlace(paymentGatewayComponentType));

        act(() => {
            result.current.tryPlaceComponent(makeClickEvent());
        });

        expect(onPlaceComponent).not.toHaveBeenCalled();
        expect(result.current.componentTypeToPlace).toEqual(paymentGatewayComponentType);
    });

    it("shows a crosshair cursor while a component is pending and restores it afterwards", () => {
        const { result, content } = setup();

        act(() => result.current.setComponentTypeToPlace(paymentGatewayComponentType));
        expect(content.style.cursor).toBe("crosshair");

        act(() => result.current.setComponentTypeToPlace(null));
        expect(content.style.cursor).toBe("default");
    });

    it("ends the placement when an annotation tool is picked", () => {
        const { result, store } = setup();
        act(() => result.current.setComponentTypeToPlace(paymentGatewayComponentType));

        act(() => {
            store.dispatch(EditorActions.setAnnotationTool("rect"));
        });

        expect(result.current.componentTypeToPlace).toBeNull();
    });

    it("drops a pending placement when the editor unmounts", () => {
        const { result, store, unmount } = setup();
        act(() => result.current.setComponentTypeToPlace(paymentGatewayComponentType));

        unmount();

        expect(store.getState().editor.componentTypeToPlace).toBeNull();
    });
});
