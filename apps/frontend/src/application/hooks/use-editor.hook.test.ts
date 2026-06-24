import React from "react";
import { renderHook, act } from "@testing-library/react";
import { Provider } from "react-redux";
import type { ReactNode } from "react";
import { useEditor } from "./use-editor.hook";
import { createStore } from "#application/store.ts";
import { SystemActions } from "#application/actions/system.actions.ts";
import { systemConnectionsAdapter } from "#application/adapters/system-connections.adapter.ts";
import { createConnection } from "#test-utils/builders.ts";
import { AnchorOrientation } from "#api/types/system.types.ts";
import { STANDARD_COMPONENT_TYPES } from "#api/types/standard-component.types.ts";
import type { SystemConnection, SystemComponent } from "#api/types/system.types.ts";

const PROJECT_ID = 1;

const renderEditorHook = (store: ReturnType<typeof createStore>) => {
    return renderHook(
        () =>
            useEditor({
                projectId: PROJECT_ID,
                showErrorMessage: vi.fn(),
            }),
        {
            wrapper: ({ children }: { children: ReactNode }) =>
                React.createElement(
                    Provider as React.FC<{ store: ReturnType<typeof createStore> }>,
                    { store },
                    children
                ),
        }
    );
};

const seedConnection = (store: ReturnType<typeof createStore>, connection: SystemConnection) => {
    store.dispatch(SystemActions.createConnection(connection));
};

const seedComponent = (store: ReturnType<typeof createStore>, component: Omit<SystemComponent, "selected">) => {
    store.dispatch(
        SystemActions.createComponent({
            id: component.id,
            name: component.name,
            type: component.type,
            x: component.x,
            y: component.y,
            gridX: component.gridX,
            gridY: component.gridY,
            projectId: component.projectId,
            symbol: component.symbol,
        })
    );
};

const getConnection = (store: ReturnType<typeof createStore>, id: string): SystemConnection | undefined => {
    return systemConnectionsAdapter.getSelectors().selectById(store.getState().system.connections, id);
};

describe("useEditor", () => {
    describe("connectionEdited", () => {
        it("sets waypoints, pinned:true, recalculate:false on the connection", () => {
            const store = createStore();
            const connection = createConnection({ id: "conn-1", projectId: PROJECT_ID });
            seedConnection(store, connection);

            const { result } = renderEditorHook(store);
            const newWaypoints = [0, 0, 100, 0, 100, 100];

            act(() => {
                result.current.connectionEdited("conn-1", newWaypoints);
            });

            const updated = getConnection(store, "conn-1");
            expect(updated?.waypoints).toEqual(newWaypoints);
            expect(updated?.pinned).toBe(true);
            expect(updated?.recalculate).toBe(false);
        });
    });

    describe("resetConnectionRouting", () => {
        it("sets pinned:false and recalculate:true on the connection", () => {
            const store = createStore();
            const connection = createConnection({
                id: "conn-1",
                projectId: PROJECT_ID,
                pinned: true,
                recalculate: false,
                waypoints: [0, 0, 100, 0],
            });
            seedConnection(store, connection);

            const { result } = renderEditorHook(store);

            act(() => {
                result.current.resetConnectionRouting("conn-1");
            });

            const updated = getConnection(store, "conn-1");
            expect(updated?.pinned).toBe(false);
            expect(updated?.recalculate).toBe(true);
        });
    });

    describe("updateConnectionsOfComponent", () => {
        it("sets recalculate:true for a non-pinned connection of the moved component", () => {
            const store = createStore();

            const compA: Omit<SystemComponent, "selected"> = {
                id: "comp-a",
                name: "A",
                type: STANDARD_COMPONENT_TYPES.CLIENT,
                x: 0,
                y: 0,
                gridX: 0,
                gridY: 0,
                width: 80,
                height: 80,
                projectId: PROJECT_ID,
                symbol: null,
            };
            const compB: Omit<SystemComponent, "selected"> = {
                id: "comp-b",
                name: "B",
                type: STANDARD_COMPONENT_TYPES.SERVER,
                x: 200,
                y: 0,
                gridX: 200,
                gridY: 0,
                width: 80,
                height: 80,
                projectId: PROJECT_ID,
                symbol: null,
            };

            seedComponent(store, compA);
            seedComponent(store, compB);

            const connection = createConnection({
                id: "conn-1",
                projectId: PROJECT_ID,
                from: { id: "comp-a", anchor: AnchorOrientation.right, type: STANDARD_COMPONENT_TYPES.CLIENT },
                to: { id: "comp-b", anchor: AnchorOrientation.left, type: STANDARD_COMPONENT_TYPES.SERVER },
                pinned: false,
                recalculate: false,
            });
            seedConnection(store, connection);

            const { result } = renderEditorHook(store);

            act(() => {
                result.current.updateConnectionsOfComponent("comp-a");
            });

            const updated = getConnection(store, "conn-1");
            expect(updated?.recalculate).toBe(true);
        });

        it("re-anchors a pinned connection endpoint and keeps recalculate:false", () => {
            const store = createStore();

            // comp-a at top-left, comp-b far to the right — so best anchor is "right"
            const compA: Omit<SystemComponent, "selected"> = {
                id: "comp-a",
                name: "A",
                type: STANDARD_COMPONENT_TYPES.CLIENT,
                x: 0,
                y: 0,
                gridX: 0,
                gridY: 0,
                width: 80,
                height: 80,
                projectId: PROJECT_ID,
                symbol: null,
            };
            const compB: Omit<SystemComponent, "selected"> = {
                id: "comp-b",
                name: "B",
                type: STANDARD_COMPONENT_TYPES.SERVER,
                x: 400,
                y: 0,
                gridX: 400,
                gridY: 0,
                width: 80,
                height: 80,
                projectId: PROJECT_ID,
                symbol: null,
            };

            seedComponent(store, compA);
            seedComponent(store, compB);

            // Existing waypoints: start at (0,40) [comp-a right midpoint], end at (400,40)
            const initialWaypoints = [0, 40, 400, 40];
            const connection = createConnection({
                id: "conn-pin",
                projectId: PROJECT_ID,
                from: { id: "comp-a", anchor: AnchorOrientation.right, type: STANDARD_COMPONENT_TYPES.CLIENT },
                to: { id: "comp-b", anchor: AnchorOrientation.left, type: STANDARD_COMPONENT_TYPES.SERVER },
                recalculate: false,
                waypoints: initialWaypoints,
            });
            seedConnection(store, connection);
            // createConnection reducer does not persist pinned; set it via setConnection
            store.dispatch(SystemActions.setConnection({ id: "conn-pin", changes: { pinned: true } }));

            const { result } = renderEditorHook(store);

            const waypointsBeforeMove = getConnection(store, "conn-pin")?.waypoints;

            act(() => {
                result.current.updateConnectionsOfComponent("comp-a");
            });

            const updated = getConnection(store, "conn-pin");
            // recalculate must remain false for pinned connections
            expect(updated?.recalculate).toBe(false);
            // waypoints must change (re-anchored)
            expect(updated?.waypoints).toBeDefined();
            // The new waypoints must still be a valid flat array (even length, at least 4 values)
            expect(updated!.waypoints.length).toBeGreaterThanOrEqual(4);
            expect(updated!.waypoints.length % 2).toBe(0);
            // All segments must be orthogonal (horizontal or vertical only)
            const waypoints = updated!.waypoints;
            for (let i = 0; i < waypoints.length - 2; i += 2) {
                const x0 = waypoints[i],
                    y0 = waypoints[i + 1];
                const x1 = waypoints[i + 2],
                    y1 = waypoints[i + 3];
                const isHorizontal = y0 === y1;
                const isVertical = x0 === x1;
                expect(isHorizontal || isVertical).toBe(true);
            }
            // Waypoints must have actually changed (re-anchored)
            expect(updated!.waypoints).not.toEqual(waypointsBeforeMove);
        });

        it("re-anchors a pinned endpoint to the moved component edge in pixel space", () => {
            const store = createStore();

            // comp-a at gridX 100 (x 500); the bug returned gridX+width (180) instead
            // of x+width (580), so asserting absolute pixel position catches it.
            const compA: Omit<SystemComponent, "selected"> = {
                id: "comp-a",
                name: "A",
                type: STANDARD_COMPONENT_TYPES.CLIENT,
                x: 500,
                y: 500,
                gridX: 100,
                gridY: 100,
                width: 80,
                height: 80,
                projectId: PROJECT_ID,
                symbol: null,
            };
            const compB: Omit<SystemComponent, "selected"> = {
                id: "comp-b",
                name: "B",
                type: STANDARD_COMPONENT_TYPES.SERVER,
                x: 900,
                y: 500,
                gridX: 180,
                gridY: 100,
                width: 80,
                height: 80,
                projectId: PROJECT_ID,
                symbol: null,
            };

            seedComponent(store, compA);
            seedComponent(store, compB);

            // from comp-a (start) to comp-b (end); start slightly off the true edge.
            const initialWaypoints = [500, 540, 900, 540];
            const connection = createConnection({
                id: "conn-pin",
                projectId: PROJECT_ID,
                from: { id: "comp-a", anchor: AnchorOrientation.right, type: STANDARD_COMPONENT_TYPES.CLIENT },
                to: { id: "comp-b", anchor: AnchorOrientation.left, type: STANDARD_COMPONENT_TYPES.SERVER },
                recalculate: false,
                waypoints: initialWaypoints,
            });
            seedConnection(store, connection);
            store.dispatch(SystemActions.setConnection({ id: "conn-pin", changes: { pinned: true } }));

            const { result } = renderEditorHook(store);

            act(() => {
                result.current.updateConnectionsOfComponent("comp-a");
            });

            const updated = getConnection(store, "conn-pin");
            // comp-a's right edge in pixel space: x = 500 + 80 = 580, y = 500 + 40 = 540.
            expect(updated!.waypoints[0]).toBe(580);
            expect(updated!.waypoints[1]).toBe(540);
            expect(updated?.recalculate).toBe(false);
        });

        it("re-anchors the moved component's own endpoint, not the nearest one", () => {
            const store = createStore();

            // comp-a has just been dragged far to the right, so its new right-edge anchor
            // (460,40) sits much closer to the END terminal (400,40) than to its own stale
            // START terminal (0,40). Selecting by distance to the moved component's NEW
            // anchor would wrongly re-anchor END. Selecting by distance to the *other*
            // (stationary) component correctly re-anchors START: END sits on comp-b, so the
            // far terminal (START) is comp-a's.
            const compA: Omit<SystemComponent, "selected"> = {
                id: "comp-a",
                name: "A",
                type: STANDARD_COMPONENT_TYPES.CLIENT,
                x: 380,
                y: 0,
                gridX: 76,
                gridY: 0,
                width: 80,
                height: 80,
                projectId: PROJECT_ID,
                symbol: null,
            };
            const compB: Omit<SystemComponent, "selected"> = {
                id: "comp-b",
                name: "B",
                type: STANDARD_COMPONENT_TYPES.SERVER,
                x: 480,
                y: 0,
                gridX: 96,
                gridY: 0,
                width: 80,
                height: 80,
                projectId: PROJECT_ID,
                symbol: null,
            };

            seedComponent(store, compA);
            seedComponent(store, compB);

            // Stale waypoints: START at comp-a's old position (0,40), END near comp-b.
            const initialWaypoints = [0, 40, 400, 40];
            const connection = createConnection({
                id: "conn-pin",
                projectId: PROJECT_ID,
                from: { id: "comp-a", anchor: AnchorOrientation.right, type: STANDARD_COMPONENT_TYPES.CLIENT },
                to: { id: "comp-b", anchor: AnchorOrientation.left, type: STANDARD_COMPONENT_TYPES.SERVER },
                recalculate: false,
                waypoints: initialWaypoints,
            });
            seedConnection(store, connection);
            store.dispatch(SystemActions.setConnection({ id: "conn-pin", changes: { pinned: true } }));

            const { result } = renderEditorHook(store);

            act(() => {
                result.current.updateConnectionsOfComponent("comp-a");
            });

            const updated = getConnection(store, "conn-pin");
            // START moves to comp-a's right edge (460,40); END (400,40) stays put.
            expect(updated!.waypoints.slice(0, 2)).toEqual([460, 40]);
            expect(updated!.waypoints.slice(-2)).toEqual([400, 40]);
        });

        it("re-anchors the moved component's endpoint when waypoints are stored to->from order", () => {
            const store = createStore();

            // The renderer stores whichever A* path is shorter, so waypoints are not always
            // ordered from->to. Here the array is to->from: index 0 is the `to` component
            // (comp-b), the last point is the `from` component (comp-a). Moving comp-b must
            // re-anchor index 0 — selecting the endpoint by from/to identity would instead
            // move comp-a's terminal and detach the connection.
            const compA: Omit<SystemComponent, "selected"> = {
                id: "comp-a",
                name: "A",
                type: STANDARD_COMPONENT_TYPES.CLIENT,
                x: 500,
                y: 500,
                gridX: 100,
                gridY: 100,
                width: 80,
                height: 80,
                projectId: PROJECT_ID,
                symbol: null,
            };
            const compB: Omit<SystemComponent, "selected"> = {
                id: "comp-b",
                name: "B",
                type: STANDARD_COMPONENT_TYPES.SERVER,
                x: 900,
                y: 500,
                gridX: 180,
                gridY: 100,
                width: 80,
                height: 80,
                projectId: PROJECT_ID,
                symbol: null,
            };

            seedComponent(store, compA);
            seedComponent(store, compB);

            // to->from order: index 0 = comp-b's left edge (slightly off at 896), last =
            // comp-a's right edge (580,540).
            const initialWaypoints = [896, 540, 580, 540];
            const connection = createConnection({
                id: "conn-pin",
                projectId: PROJECT_ID,
                from: { id: "comp-a", anchor: AnchorOrientation.right, type: STANDARD_COMPONENT_TYPES.CLIENT },
                to: { id: "comp-b", anchor: AnchorOrientation.left, type: STANDARD_COMPONENT_TYPES.SERVER },
                recalculate: false,
                waypoints: initialWaypoints,
            });
            seedConnection(store, connection);
            store.dispatch(SystemActions.setConnection({ id: "conn-pin", changes: { pinned: true } }));

            const { result } = renderEditorHook(store);

            act(() => {
                result.current.updateConnectionsOfComponent("comp-b");
            });

            const updated = getConnection(store, "conn-pin");
            // comp-b's left edge in pixel space: x = 900, y = 500 + 40 = 540. Index 0 snaps
            // there; comp-a's terminal (580,540) is untouched.
            expect(updated!.waypoints.slice(0, 2)).toEqual([900, 540]);
            expect(updated!.waypoints.slice(-2)).toEqual([580, 540]);
            expect(updated?.recalculate).toBe(false);
        });

        it("recalculates a pinned connection whose waypoints are empty (cannot re-anchor)", () => {
            const store = createStore();

            const compA: Omit<SystemComponent, "selected"> = {
                id: "comp-a",
                name: "A",
                type: STANDARD_COMPONENT_TYPES.CLIENT,
                x: 500,
                y: 500,
                gridX: 100,
                gridY: 100,
                width: 80,
                height: 80,
                projectId: PROJECT_ID,
                symbol: null,
            };
            const compB: Omit<SystemComponent, "selected"> = {
                id: "comp-b",
                name: "B",
                type: STANDARD_COMPONENT_TYPES.SERVER,
                x: 900,
                y: 500,
                gridX: 180,
                gridY: 100,
                width: 80,
                height: 80,
                projectId: PROJECT_ID,
                symbol: null,
            };
            seedComponent(store, compA);
            seedComponent(store, compB);

            const connection = createConnection({
                id: "conn-pin",
                projectId: PROJECT_ID,
                from: { id: "comp-a", anchor: AnchorOrientation.right, type: STANDARD_COMPONENT_TYPES.CLIENT },
                to: { id: "comp-b", anchor: AnchorOrientation.left, type: STANDARD_COMPONENT_TYPES.SERVER },
                recalculate: false,
                waypoints: [],
            });
            seedConnection(store, connection);
            store.dispatch(SystemActions.setConnection({ id: "conn-pin", changes: { pinned: true } }));

            const { result } = renderEditorHook(store);

            act(() => {
                result.current.updateConnectionsOfComponent("comp-a");
            });

            const updated = getConnection(store, "conn-pin");
            // Cannot re-anchor a degenerate path → recalculate instead of detaching.
            expect(updated?.recalculate).toBe(true);
            expect(updated!.waypoints).toEqual([]);
        });

        it("recalculates a pinned connection whose waypoints are too short to re-anchor", () => {
            const store = createStore();

            const compA: Omit<SystemComponent, "selected"> = {
                id: "comp-a",
                name: "A",
                type: STANDARD_COMPONENT_TYPES.CLIENT,
                x: 500,
                y: 500,
                gridX: 100,
                gridY: 100,
                width: 80,
                height: 80,
                projectId: PROJECT_ID,
                symbol: null,
            };
            const compB: Omit<SystemComponent, "selected"> = {
                id: "comp-b",
                name: "B",
                type: STANDARD_COMPONENT_TYPES.SERVER,
                x: 900,
                y: 500,
                gridX: 180,
                gridY: 100,
                width: 80,
                height: 80,
                projectId: PROJECT_ID,
                symbol: null,
            };
            seedComponent(store, compA);
            seedComponent(store, compB);

            const connection = createConnection({
                id: "conn-pin",
                projectId: PROJECT_ID,
                from: { id: "comp-a", anchor: AnchorOrientation.right, type: STANDARD_COMPONENT_TYPES.CLIENT },
                to: { id: "comp-b", anchor: AnchorOrientation.left, type: STANDARD_COMPONENT_TYPES.SERVER },
                recalculate: false,
                waypoints: [0, 40], // one point — below the 4-value minimum
            });
            seedConnection(store, connection);
            store.dispatch(SystemActions.setConnection({ id: "conn-pin", changes: { pinned: true } }));

            const { result } = renderEditorHook(store);

            act(() => {
                result.current.updateConnectionsOfComponent("comp-a");
            });

            const updated = getConnection(store, "conn-pin");
            expect(updated?.recalculate).toBe(true);
            expect(updated!.waypoints).toEqual([0, 40]);
        });
    });
});
