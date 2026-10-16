import { createElement, createRef, type ComponentType } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { Arc, Circle, Group, Image, Layer, Line, Stage } from "react-konva";
import { konvaTestControls, type FakeLayer, type FakeStage, type KonvaTestEvent } from "./konva-mock.ts";

// react-konva is replaced by konva-mock.ts in vitest.setup.ts, so these are the stubs under test.
const renderShape = (Shape: unknown, props: Record<string, unknown>) =>
    render(createElement(Shape as ComponentType<Record<string, unknown>>, props));

const lastEvent = (handler: ReturnType<typeof vi.fn>): KonvaTestEvent => handler.mock.lastCall![0] as KonvaTestEvent;

describe("konva-mock", () => {
    describe("event translation", () => {
        it.each([
            ["Line", Line, "konva-line"],
            ["Group", Group, "konva-group"],
            ["Image", Image, "konva-image"],
            ["Arc", Arc, "konva-arc"],
        ])("a click on %s hands the handler a Konva-shaped event", (_name, Shape, testId) => {
            const onClick = vi.fn();
            renderShape(Shape, { onClick });

            fireEvent.click(screen.getByTestId(testId));

            const event = lastEvent(onClick);
            expect(event.evt).toBeInstanceOf(MouseEvent);
            expect((event.evt as MouseEvent).button).toBe(0);
            expect(event.target).toBe(screen.getByTestId(testId));
            expect(event.cancelBubble).toBe(false);
            for (const method of ["getStage", "getLayer", "position", "setPosition", "stopDrag"]) {
                expect(event.target[method]).toBeTypeOf("function");
            }
        });

        it("defaults the target to a node without a stage and a layer that can redraw", () => {
            const onClick = vi.fn();
            renderShape(Line, { onClick });

            fireEvent.click(screen.getByTestId("konva-line"));

            const target = lastEvent(onClick).target as {
                getStage: () => unknown;
                getLayer: () => { batchDraw: () => void };
            };
            expect(target.getStage()).toBeNull();
            expect(target.getLayer().batchDraw).toBeTypeOf("function");
        });

        it("tracks the default position across setPosition and position calls", () => {
            const onDragEnd = vi.fn();
            renderShape(Group, { onDragEnd });
            const group = screen.getByTestId("konva-group");

            fireEvent.dragEnd(group);
            const target = lastEvent(onDragEnd).target as {
                x: () => number;
                y: () => number;
                position: (point?: { x: number; y: number }) => { x: number; y: number };
                setPosition: (point: { x: number; y: number }) => void;
            };
            expect(target.position()).toEqual({ x: 0, y: 0 });

            target.setPosition({ x: 40, y: 60 });
            expect(target.x()).toBe(40);
            expect(target.y()).toBe(60);

            target.position({ x: 5, y: 7 });
            expect(target.position()).toEqual({ x: 5, y: 7 });
        });

        it("keeps stub properties passed via fireEvent ahead of the node defaults", () => {
            const onDragMove = vi.fn();
            renderShape(Line, { onDragMove });
            const stubTarget = { x: () => 20, y: () => 30, position: () => ({ x: 20, y: 30 }) };

            fireEvent.drag(screen.getByTestId("konva-line"), { target: stubTarget });

            const target = lastEvent(onDragMove).target as typeof stubTarget;
            expect(target.x()).toBe(20);
            expect(target.y()).toBe(30);
            expect(target.position()).toEqual({ x: 20, y: 30 });
        });

        it("forwards drag start and drag end on a Group", () => {
            const onDragStart = vi.fn();
            const onDragEnd = vi.fn();
            renderShape(Group, { onDragStart, onDragEnd });
            const group = screen.getByTestId("konva-group");

            fireEvent.dragStart(group);
            fireEvent.dragEnd(group);

            expect(onDragStart).toHaveBeenCalledOnce();
            expect(onDragEnd).toHaveBeenCalledOnce();
        });

        it.each([
            ["Line", Line, "konva-line"],
            ["Group", Group, "konva-group"],
            ["Image", Image, "konva-image"],
            ["Arc", Arc, "konva-arc"],
        ])("mouseOver and mouseOut on %s reach onMouseOver and onMouseOut", (_name, Shape, testId) => {
            const onMouseOver = vi.fn();
            const onMouseOut = vi.fn();
            renderShape(Shape, { onMouseOver, onMouseOut });

            fireEvent.mouseOver(screen.getByTestId(testId));
            fireEvent.mouseOut(screen.getByTestId(testId));

            expect(onMouseOver).toHaveBeenCalledOnce();
            expect(onMouseOut).toHaveBeenCalledOnce();
        });

        it("bubbles a child event to its Group with the child as target and the Group as currentTarget", () => {
            const onClick = vi.fn();
            render(
                createElement(
                    Group as unknown as ComponentType<Record<string, unknown>>,
                    { onClick },
                    createElement(Image as unknown as ComponentType<Record<string, unknown>>, {})
                )
            );

            fireEvent.click(screen.getByTestId("konva-image"));

            const event = lastEvent(onClick);
            expect(event.target).toBe(screen.getByTestId("konva-image"));
            expect(event.currentTarget).toBe(screen.getByTestId("konva-group"));
        });

        it("stops the DOM event from bubbling when a handler sets cancelBubble", () => {
            const onGroupClick = vi.fn();
            render(
                createElement(
                    Group as unknown as ComponentType<Record<string, unknown>>,
                    { onClick: onGroupClick },
                    createElement(Line as unknown as ComponentType<Record<string, unknown>>, {
                        onClick: (event: KonvaTestEvent) => {
                            event.cancelBubble = true;
                        },
                    })
                )
            );

            fireEvent.click(screen.getByTestId("konva-line"));

            expect(onGroupClick).not.toHaveBeenCalled();
        });

        it.each([
            ["Circle", Circle, "konva-circle"],
            ["Group", Group, "konva-group"],
        ])("forwards a double click on %s to onDblClick", (_name, Shape, testId) => {
            const onDblClick = vi.fn();
            renderShape(Shape, { onDblClick });

            fireEvent.dblClick(screen.getByTestId(testId));

            expect(onDblClick).toHaveBeenCalledOnce();
        });
    });

    describe("data attributes", () => {
        it("keeps the existing data-* attributes on Line, Circle and Arc", () => {
            renderShape(Line, {
                stroke: "red",
                strokeWidth: 2,
                listening: false,
                points: [0, 0, 10, 10],
                dash: [4, 2],
                draggable: true,
                dragDistance: 8,
            });
            renderShape(Circle, { x: 1, y: 2, radius: 3, stroke: "blue", strokeWidth: 4, draggable: false });
            renderShape(Arc, { fill: "green" });

            const line = screen.getByTestId("konva-line");
            expect(line).toHaveAttribute("data-stroke", "red");
            expect(line).toHaveAttribute("data-stroke-width", "2");
            expect(line).toHaveAttribute("data-listening", "false");
            expect(line).toHaveAttribute("data-points", "[0,0,10,10]");
            expect(line).toHaveAttribute("data-dash", "[4,2]");
            expect(line).toHaveAttribute("data-draggable", "true");
            expect(line).toHaveAttribute("data-drag-distance", "8");

            const circle = screen.getByTestId("konva-circle");
            expect(circle).toHaveAttribute("data-x", "1");
            expect(circle).toHaveAttribute("data-y", "2");
            expect(circle).toHaveAttribute("data-radius", "3");
            expect(circle).toHaveAttribute("data-stroke", "blue");
            expect(circle).toHaveAttribute("data-stroke-width", "4");
            expect(circle).toHaveAttribute("data-draggable", "false");

            expect(screen.getByTestId("konva-arc")).toHaveAttribute("data-fill", "green");
        });
    });

    describe("Stage", () => {
        const renderStage = (props: Record<string, unknown> = {}, children?: unknown) => {
            const ref = createRef<FakeStage>();
            render(
                createElement(
                    Stage as unknown as ComponentType<Record<string, unknown>>,
                    { ...props, ref },
                    children as never
                )
            );
            return ref.current!;
        };

        it("exposes the fake stage through its ref and as the mounted stage", () => {
            const stage = renderStage();

            expect(stage.nodeType).toBe("Stage");
            expect(stage.content).toBe(screen.getByTestId("konva-stage"));
            expect(konvaTestControls.getMountedStage()).toBe(stage);
        });

        it("reports the stage itself as target for an event on the empty stage", () => {
            const onMouseDown = vi.fn();
            const stage = renderStage({ onMouseDown });

            fireEvent.mouseDown(screen.getByTestId("konva-stage"), { button: 0 });

            const event = lastEvent(onMouseDown);
            expect(event.target).toBe(stage);
            expect(event.target["nodeType"]).toBe("Stage");
        });

        it("reports the hit shape as target for an event on a child", () => {
            const onClick = vi.fn();
            renderStage({ onClick }, createElement(Line as unknown as ComponentType<Record<string, unknown>>, {}));

            fireEvent.click(screen.getByTestId("konva-line"));

            expect(lastEvent(onClick).target).toBe(screen.getByTestId("konva-line"));
        });

        it("gives child nodes the mounted stage from getStage()", () => {
            const onClick = vi.fn();
            const stage = renderStage(
                {},
                createElement(Line as unknown as ComponentType<Record<string, unknown>>, { onClick })
            );

            fireEvent.click(screen.getByTestId("konva-line"));

            expect((lastEvent(onClick).target["getStage"] as () => unknown)()).toBe(stage);
        });

        it("adds layerX/layerY and keeps movementX/movementY on the native event", () => {
            const onMouseMove = vi.fn();
            renderStage({ onMouseMove });

            fireEvent.mouseMove(screen.getByTestId("konva-stage"), {
                clientX: 30,
                clientY: 40,
                movementX: 5,
                movementY: -2,
            });

            const evt = lastEvent(onMouseMove).evt as MouseEvent & { layerX: number; layerY: number };
            expect([evt.layerX, evt.layerY, evt.movementX, evt.movementY]).toEqual([30, 40, 5, -2]);
        });

        it("follows the last event's client position for the pointer, with the override taking precedence", () => {
            const stage = renderStage({ onMouseMove: vi.fn() });
            expect(stage.getPointerPosition()).toBeNull();

            fireEvent.mouseMove(screen.getByTestId("konva-stage"), { clientX: 12, clientY: 34 });
            expect(stage.getPointerPosition()).toEqual({ x: 12, y: 34 });

            konvaTestControls.setPointerPosition({ x: 100, y: 200 });
            expect(stage.getPointerPosition()).toEqual({ x: 100, y: 200 });
        });

        it("converts the pointer into stage coordinates using position and scale", () => {
            const stage = renderStage();
            konvaTestControls.setPointerPosition({ x: 110, y: 70 });

            stage.position({ x: 10, y: 20 });
            stage.scale({ x: 2, y: 2 });

            expect(stage.x()).toBe(10);
            expect(stage.y()).toBe(20);
            expect(stage.scaleX()).toBe(2);
            expect(stage.scaleY()).toBe(2);
            expect(stage.getRelativePointerPosition()).toEqual({ x: 50, y: 25 });
        });

        it("lets a stage size from the controls win over the size setter", () => {
            const stage = renderStage();
            stage.width(300);
            stage.height(200);
            expect([stage.width(), stage.height()]).toEqual([300, 200]);

            konvaTestControls.setStageSize({ width: 1000, height: 800 });
            stage.width(0);
            stage.height(0);

            expect([stage.width(), stage.height()]).toEqual([1000, 800]);
        });
    });

    describe("Layer", () => {
        const renderLayer = () => {
            const ref = createRef<FakeLayer>();
            render(createElement(Layer as unknown as ComponentType<Record<string, unknown>>, { ref }));
            return ref.current!;
        };

        it("exposes a fake layer through its ref with an empty canvas by default", () => {
            const layer = renderLayer();

            expect(layer.getClientRect()).toEqual({ x: 0, y: 0, width: 0, height: 0 });
            expect(layer.find("Image")).toEqual([]);
            expect(layer.toDataURL()).toBe("data:,");
        });

        it("reports the bounding box and image set via the controls", () => {
            const layer = renderLayer();

            konvaTestControls.setLayerClientRect({ x: 10, y: 20, width: 300, height: 150 });
            konvaTestControls.setLayerDataUrl("data:image/png;base64,AAAA");

            expect(layer.getClientRect()).toEqual({ x: 10, y: 20, width: 300, height: 150 });
            expect(layer.toDataURL()).toBe("data:image/png;base64,AAAA");
        });

        it("throws the export error set via the controls until it is cleared", () => {
            const layer = renderLayer();
            const exportError = new Error("tainted canvas");

            konvaTestControls.setLayerDataUrlError(exportError);
            expect(() => layer.toDataURL()).toThrow(exportError);

            konvaTestControls.setLayerDataUrlError(null);
            expect(layer.toDataURL()).toBe("data:,");
        });

        it("still renders its children without a ref", () => {
            render(
                createElement(
                    Layer as unknown as ComponentType<Record<string, unknown>>,
                    {},
                    createElement(Line as unknown as ComponentType<Record<string, unknown>>, {})
                )
            );

            expect(screen.getByTestId("konva-layer")).toContainElement(screen.getByTestId("konva-line"));
        });
    });

    describe("reset between tests", () => {
        it("sets a stage size, a pointer override and layer values", () => {
            konvaTestControls.setStageSize({ width: 1, height: 1 });
            konvaTestControls.setPointerPosition({ x: 1, y: 1 });
            konvaTestControls.setLayerClientRect({ x: 1, y: 1, width: 1, height: 1 });
            konvaTestControls.setLayerDataUrl("data:image/png;base64,AAAA");
            konvaTestControls.setLayerDataUrlError(new Error("tainted canvas"));

            expect(konvaTestControls.getMountedStage()).toBeNull();
        });

        it("starts the next test with the defaults again", () => {
            const stageRef = createRef<FakeStage>();
            const layerRef = createRef<FakeLayer>();
            render(
                createElement(
                    Stage as unknown as ComponentType<Record<string, unknown>>,
                    { ref: stageRef },
                    createElement(Layer as unknown as ComponentType<Record<string, unknown>>, { ref: layerRef })
                )
            );

            expect(stageRef.current!.width()).toBe(0);
            expect(stageRef.current!.getPointerPosition()).toBeNull();
            expect(layerRef.current!.getClientRect()).toEqual({ x: 0, y: 0, width: 0, height: 0 });
            expect(layerRef.current!.toDataURL()).toBe("data:,");
        });
    });
});
