import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { I18nextProvider } from "react-i18next";
import type { ReactNode } from "react";
import { useEditor } from "./use-editor.hook";
import { createStore } from "#application/store.ts";
import { translationUtil } from "#utils/translations.ts";
import { EditorActions } from "#application/actions/editor.actions.ts";
import { SystemActions } from "#application/actions/system.actions.ts";
import { PointsOfAttackActions } from "#application/actions/points-of-attack.actions.ts";
import {
    createAsset,
    createCommunicationInterface,
    createComponentPayload,
    createConnection,
    createConnectionAnchor,
    createConnectionPoint,
    createPointOfAttack,
} from "#test-utils/builders.ts";
import { STANDARD_COMPONENT_TYPES } from "#api/types/standard-component.types.ts";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";

type EditorStore = ReturnType<typeof createStore>;

// we seed by dispatching the same actions the app dispatches
// and assert on the resulting store state — behaviour, not internals.
const renderUseEditor = (seed?: (store: EditorStore) => void) => {
    const store = createStore();
    seed?.(store);

    const showErrorMessage = vi.fn();
    const wrapper = ({ children }: { children: ReactNode }) => (
        <Provider store={store}>
            <I18nextProvider i18n={translationUtil}>{children}</I18nextProvider>
        </Provider>
    );

    const view = renderHook(() => useEditor({ projectId: 1, showErrorMessage }), { wrapper });
    return { ...view, store, showErrorMessage };
};

const seedComponentWithInterface = (store: EditorStore, interfaceId: string, interfaceName: string) => {
    store.dispatch(SystemActions.createComponent(createComponentPayload({ id: "comp-1", name: "Server" })));
    store.dispatch(
        SystemActions.setComponent({
            id: "comp-1",
            changes: {
                communicationInterfaces: [createCommunicationInterface({ id: interfaceId, name: interfaceName })],
            },
        })
    );
    store.dispatch(
        PointsOfAttackActions.createPointOfAttack(
            createPointOfAttack({
                id: interfaceId,
                componentId: "comp-1",
                name: interfaceName,
                type: POINTS_OF_ATTACK.COMMUNICATION_INTERFACES,
            })
        )
    );
    store.dispatch(
        SystemActions.createConnectionPoint(
            createConnectionPoint({ id: interfaceId, name: interfaceName, connectionId: "" })
        )
    );
};

describe("useEditor", () => {
    describe("selectConnector", () => {
        const seedConnectorComponents = (store: EditorStore) => {
            const componentsByType: [string, STANDARD_COMPONENT_TYPES][] = [
                ["users-1", STANDARD_COMPONENT_TYPES.USERS],
                ["users-2", STANDARD_COMPONENT_TYPES.USERS],
                ["client-1", STANDARD_COMPONENT_TYPES.CLIENT],
                ["server-1", STANDARD_COMPONENT_TYPES.SERVER],
                ["infra-1", STANDARD_COMPONENT_TYPES.COMMUNICATION_INFRASTRUCTURE],
                ["infra-2", STANDARD_COMPONENT_TYPES.COMMUNICATION_INFRASTRUCTURE],
            ];
            componentsByType.forEach(([id, type]) => {
                store.dispatch(SystemActions.createComponent(createComponentPayload({ id, type })));
            });
        };

        const connect = (
            result: ReturnType<typeof renderUseEditor>["result"],
            from: ReturnType<typeof createConnectionAnchor>,
            to: ReturnType<typeof createConnectionAnchor>
        ) => {
            act(() => result.current.selectConnector(from));
            act(() => result.current.selectConnector(to));
        };

        type ConnectorCase = [
            label: string,
            from: ReturnType<typeof createConnectionAnchor>,
            to: ReturnType<typeof createConnectionAnchor>,
        ];

        // Each row is an allowed pairing: the second click creates exactly one
        // connection wired from→to, with no error surfaced.
        const allowedPairings: ConnectorCase[] = [
            [
                "users → system component",
                createConnectionAnchor({ id: "users-1", type: STANDARD_COMPONENT_TYPES.USERS }),
                createConnectionAnchor({ id: "client-1", type: STANDARD_COMPONENT_TYPES.CLIENT }),
            ],
            [
                "system component → users",
                createConnectionAnchor({ id: "client-1", type: STANDARD_COMPONENT_TYPES.CLIENT }),
                createConnectionAnchor({ id: "users-1", type: STANDARD_COMPONENT_TYPES.USERS }),
            ],
            [
                "system component with interface → communication infrastructure",
                createConnectionAnchor({
                    id: "client-1",
                    type: STANDARD_COMPONENT_TYPES.CLIENT,
                    communicationInterfaceId: "ci-1",
                }),
                createConnectionAnchor({ id: "infra-1", type: STANDARD_COMPONENT_TYPES.COMMUNICATION_INFRASTRUCTURE }),
            ],
            [
                "communication infrastructure → system component with interface",
                createConnectionAnchor({ id: "infra-1", type: STANDARD_COMPONENT_TYPES.COMMUNICATION_INFRASTRUCTURE }),
                createConnectionAnchor({
                    id: "client-1",
                    type: STANDARD_COMPONENT_TYPES.CLIENT,
                    communicationInterfaceId: "ci-1",
                }),
            ],
        ];

        it.each(allowedPairings)("creates a connection for an allowed pairing: %s", (_label, from, to) => {
            const { result, store, showErrorMessage } = renderUseEditor(seedConnectorComponents);

            connect(result, from, to);

            expect(showErrorMessage).not.toHaveBeenCalled();
            const connections = store.getState().system.connections;
            expect(connections.ids).toHaveLength(1);
            const created = Object.values(connections.entities)[0];
            expect(created?.from.id).toBe(from.id);
            expect(created?.to.id).toBe(to.id);
        });

        // Each row is a disallowed pairing: the second click surfaces exactly one
        // error and creates nothing.
        const disallowedPairings: ConnectorCase[] = [
            [
                "users → users",
                createConnectionAnchor({ id: "users-1", type: STANDARD_COMPONENT_TYPES.USERS }),
                createConnectionAnchor({ id: "users-2", type: STANDARD_COMPONENT_TYPES.USERS }),
            ],
            [
                "users → communication infrastructure",
                createConnectionAnchor({ id: "users-1", type: STANDARD_COMPONENT_TYPES.USERS }),
                createConnectionAnchor({ id: "infra-1", type: STANDARD_COMPONENT_TYPES.COMMUNICATION_INFRASTRUCTURE }),
            ],
            [
                "system component → system component",
                createConnectionAnchor({ id: "client-1", type: STANDARD_COMPONENT_TYPES.CLIENT }),
                createConnectionAnchor({ id: "server-1", type: STANDARD_COMPONENT_TYPES.SERVER }),
            ],
            [
                "system component without interface → communication infrastructure",
                createConnectionAnchor({ id: "client-1", type: STANDARD_COMPONENT_TYPES.CLIENT }),
                createConnectionAnchor({ id: "infra-1", type: STANDARD_COMPONENT_TYPES.COMMUNICATION_INFRASTRUCTURE }),
            ],
            [
                "communication infrastructure → system component without interface",
                createConnectionAnchor({ id: "infra-1", type: STANDARD_COMPONENT_TYPES.COMMUNICATION_INFRASTRUCTURE }),
                createConnectionAnchor({ id: "client-1", type: STANDARD_COMPONENT_TYPES.CLIENT }),
            ],
            [
                "communication infrastructure → communication infrastructure",
                createConnectionAnchor({ id: "infra-1", type: STANDARD_COMPONENT_TYPES.COMMUNICATION_INFRASTRUCTURE }),
                createConnectionAnchor({ id: "infra-2", type: STANDARD_COMPONENT_TYPES.COMMUNICATION_INFRASTRUCTURE }),
            ],
        ];

        it.each(disallowedPairings)("rejects a disallowed pairing and creates nothing: %s", (_label, from, to) => {
            const { result, store, showErrorMessage } = renderUseEditor(seedConnectorComponents);

            connect(result, from, to);

            expect(showErrorMessage).toHaveBeenCalledTimes(1);
            expect(store.getState().system.connections.ids).toHaveLength(0);
        });

        it("opens a preview on the first click without creating a connection", () => {
            const { result, store, showErrorMessage } = renderUseEditor(seedConnectorComponents);

            act(() => {
                result.current.selectConnector(
                    createConnectionAnchor({ id: "client-1", type: STANDARD_COMPONENT_TYPES.CLIENT })
                );
            });

            expect(store.getState().editor.connection?.from?.id).toBe("client-1");
            expect(store.getState().system.connections.ids).toHaveLength(0);
            expect(showErrorMessage).not.toHaveBeenCalled();
        });

        it("clicking the same anchor twice creates nothing", () => {
            const { result, store, showErrorMessage } = renderUseEditor(seedConnectorComponents);
            const sameAnchor = createConnectionAnchor({ id: "client-1", type: STANDARD_COMPONENT_TYPES.CLIENT });

            connect(result, sameAnchor, sameAnchor);

            expect(store.getState().system.connections.ids).toHaveLength(0);
            expect(showErrorMessage).not.toHaveBeenCalled();
        });
    });

    // cascade delete — removeComponent must also drop the
    // component's connections and points of attack.
    describe("removeComponent", () => {
        it("removes the selected component together with its connections and points of attack", () => {
            const { result, store } = renderUseEditor((store) => {
                store.dispatch(SystemActions.createComponent(createComponentPayload({ id: "comp-1" })));
                store.dispatch(
                    PointsOfAttackActions.createPointOfAttack(
                        createPointOfAttack({ id: "poa-1", componentId: "comp-1" })
                    )
                );
                store.dispatch(SystemActions.createConnection(createConnection({ id: "conn-1" })));
                store.dispatch(EditorActions.selectComponent("comp-1"));
            });

            const seeded = store.getState().system;
            expect(seeded.components.ids).toHaveLength(1);
            expect(seeded.pointsOfAttack.ids).toHaveLength(1);
            expect(seeded.connections.ids).toHaveLength(1);

            act(() => {
                result.current.removeComponent();
            });

            const state = store.getState().system;
            expect(state.components.ids).toHaveLength(0);
            expect(state.pointsOfAttack.ids).toHaveLength(0);
            expect(state.connections.ids).toHaveLength(0);
        });
    });

    // addComponent creates the component plus one
    // point of attack per attack-point type on its component type.
    describe("addComponent", () => {
        it("creates a component and one point of attack per attack-point type", () => {
            const { result, store } = renderUseEditor();

            act(() => {
                result.current.addComponent({
                    componentType: {
                        id: STANDARD_COMPONENT_TYPES.CLIENT,
                        name: "Client",
                        symbol: null,
                        standardIcon: null,
                        pointsOfAttack: [POINTS_OF_ATTACK.USER_INTERFACE, POINTS_OF_ATTACK.PROCESSING_INFRASTRUCTURE],
                    },
                    x: 10,
                    y: 20,
                    gridX: 1,
                    gridY: 2,
                });
            });

            const state = store.getState().system;
            expect(state.components.ids).toHaveLength(1);

            const componentId = state.components.ids[0];
            const pointsOfAttack = state.pointsOfAttack.ids.map((id) => state.pointsOfAttack.entities[id]);
            expect(pointsOfAttack).toHaveLength(2);
            expect(pointsOfAttack.every((pointOfAttack) => pointOfAttack?.componentId === componentId)).toBe(true);
        });
    });

    // setSelectedComponentName ignores a
    // blank name instead of writing it.
    describe("setSelectedComponentName", () => {
        it("ignores a blank name", () => {
            const { result, store } = renderUseEditor((store) => {
                store.dispatch(
                    SystemActions.createComponent(createComponentPayload({ id: "comp-1", name: "Original" }))
                );
                store.dispatch(EditorActions.selectComponent("comp-1"));
            });

            act(() => {
                result.current.setSelectedComponentName("   ");
            });

            expect(store.getState().system.components.entities["comp-1"]?.name).toBe("Original");
        });
    });

    // removeConnection drops the connection and any
    // points of attack tied to it, and falls back to the selected connection.
    describe("removeConnection", () => {
        it("removes a passed connection together with its points of attack", () => {
            const { result, store } = renderUseEditor((store) => {
                store.dispatch(SystemActions.createConnection(createConnection({ id: "conn-1" })));
                store.dispatch(
                    PointsOfAttackActions.createPointOfAttack(
                        createPointOfAttack({ id: "poa-1", connectionId: "conn-1" })
                    )
                );
            });

            expect(store.getState().system.connections.ids).toHaveLength(1);
            expect(store.getState().system.pointsOfAttack.ids).toHaveLength(1);

            act(() => {
                result.current.removeConnection(createConnection({ id: "conn-1" }));
            });

            const state = store.getState().system;
            expect(state.connections.ids).toHaveLength(0);
            expect(state.pointsOfAttack.ids).toHaveLength(0);
        });

        it("falls back to the selected connection when called without an argument", () => {
            const { result, store } = renderUseEditor((store) => {
                store.dispatch(SystemActions.createConnection(createConnection({ id: "conn-1" })));
                store.dispatch(EditorActions.selectConnection("conn-1"));
            });

            act(() => {
                result.current.removeConnection();
            });

            expect(store.getState().system.connections.ids).toHaveLength(0);
        });

        it("does nothing when no connection is passed and none is selected", () => {
            const { result, store } = renderUseEditor((store) => {
                store.dispatch(SystemActions.createConnection(createConnection({ id: "conn-1" })));
            });

            act(() => {
                result.current.removeConnection();
            });

            expect(store.getState().system.connections.ids).toHaveLength(1);
        });
    });

    // addCommunicationInterface adds the interface to
    // the component and creates a point of attack and connection point sharing its id.
    describe("addCommunicationInterface", () => {
        it("adds the interface to the component and creates its point of attack and connection point", () => {
            const { result, store } = renderUseEditor((store) => {
                store.dispatch(SystemActions.createComponent(createComponentPayload({ id: "comp-1", name: "Server" })));
            });

            act(() => {
                result.current.addCommunicationInterface("comp-1", "REST API", "icon-name");
            });

            const state = store.getState().system;
            const createdInterface = state.components.entities["comp-1"]?.communicationInterfaces?.[0];
            expect(state.components.entities["comp-1"]?.communicationInterfaces).toHaveLength(1);
            expect(createdInterface?.name).toBe("REST API");
            expect(createdInterface?.icon).toBe("icon-name");
            expect(createdInterface?.type).toBe(POINTS_OF_ATTACK.COMMUNICATION_INTERFACES);

            const interfaceId = createdInterface?.id;
            const pointsOfAttack = Object.values(state.pointsOfAttack.entities);
            expect(pointsOfAttack).toHaveLength(1);
            expect(pointsOfAttack[0]?.id).toBe(interfaceId);
            expect(pointsOfAttack[0]?.type).toBe(POINTS_OF_ATTACK.COMMUNICATION_INTERFACES);
            expect(pointsOfAttack[0]?.componentId).toBe("comp-1");

            const connectionPoints = Object.values(state.connectionPoints.entities);
            expect(connectionPoints).toHaveLength(1);
            expect(connectionPoints[0]?.id).toBe(interfaceId);
        });

        it("does nothing for an unknown component", () => {
            const { result, store } = renderUseEditor();

            act(() => {
                result.current.addCommunicationInterface("does-not-exist", "REST API", null);
            });

            const state = store.getState().system;
            expect(state.pointsOfAttack.ids).toHaveLength(0);
            expect(state.connectionPoints.ids).toHaveLength(0);
        });
    });

    // handleDeleteCommunicationInterface removes the interface, its point of attack,
    // its connection point, and any connection that uses it.
    describe("handleDeleteCommunicationInterface", () => {
        it("removes the interface and everything tied to it", () => {
            const interfaceId = "ci-1";
            const { result, store } = renderUseEditor((store) => {
                seedComponentWithInterface(store, interfaceId, "REST API");
                store.dispatch(
                    SystemActions.createConnection(
                        createConnection({
                            id: "conn-1",
                            from: createConnectionAnchor({ id: "comp-1", communicationInterfaceId: interfaceId }),
                        })
                    )
                );
            });

            // all four are present up front.
            const seeded = store.getState().system;
            expect(seeded.components.entities["comp-1"]?.communicationInterfaces).toHaveLength(1);
            expect(seeded.pointsOfAttack.ids).toContain(interfaceId);
            expect(seeded.connectionPoints.ids).toContain(interfaceId);
            expect(seeded.connections.ids).toContain("conn-1");

            act(() => {
                result.current.handleDeleteCommunicationInterface("comp-1", interfaceId);
            });

            const state = store.getState().system;
            expect(state.components.entities["comp-1"]?.communicationInterfaces).toHaveLength(0);
            expect(state.pointsOfAttack.ids).not.toContain(interfaceId);
            expect(state.connectionPoints.ids).not.toContain(interfaceId);
            expect(state.connections.ids).not.toContain("conn-1");
        });
    });

    // handleChangeCommunicationInterfaceName renames the interface on the component,
    // its connection point, and its point of attack together.
    //
    describe("handleChangeCommunicationInterfaceName", () => {
        it("renames the interface, its connection point, and its point of attack", () => {
            const interfaceId = "ci-1";
            const { result, store } = renderUseEditor((store) => {
                seedComponentWithInterface(store, interfaceId, "Old name");
            });

            act(() => {
                result.current.handleChangeCommunicationInterfaceName("comp-1", interfaceId, "New name");
            });

            const state = store.getState().system;
            expect(state.components.entities["comp-1"]?.communicationInterfaces?.[0]?.name).toBe("New name");
            expect(state.connectionPoints.entities[interfaceId]?.name).toBe("New name");
            expect(state.pointsOfAttack.entities[interfaceId]?.name).toBe("New name");
        });
    });

    // addAssetToPointOfAttack adds an asset once and ignores a repeat
    describe("addAssetToPointOfAttack", () => {
        it("adds an asset and ignores a duplicate", () => {
            const { result, store } = renderUseEditor((store) => {
                store.dispatch(PointsOfAttackActions.createPointOfAttack(createPointOfAttack({ id: "poa-1" })));
            });

            act(() => {
                result.current.addAssetToPointOfAttack(
                    createAsset({ id: 5 }),
                    createPointOfAttack({ id: "poa-1", assets: [] })
                );
            });
            expect(store.getState().system.pointsOfAttack.entities["poa-1"]?.assets).toEqual([5]);

            // Same asset again: the existing entry must not be duplicated.
            act(() => {
                result.current.addAssetToPointOfAttack(
                    createAsset({ id: 5 }),
                    createPointOfAttack({ id: "poa-1", assets: [5] })
                );
            });
            expect(store.getState().system.pointsOfAttack.entities["poa-1"]?.assets).toEqual([5]);
        });
    });

    // A batch of connections recalculated together only sees each other's old lines, so once the
    // whole batch has reported, it is flagged one more time (and only one more time) — in that
    // second pass every member routes against its siblings' fresh lines.
    describe("connection recalculation second pass", () => {
        const seedHubWithTwoConnections = (store: EditorStore): void => {
            store.dispatch(SystemActions.createComponent(createComponentPayload({ id: "comp-1" })));
            store.dispatch(SystemActions.createComponent(createComponentPayload({ id: "comp-2" })));
            store.dispatch(SystemActions.createComponent(createComponentPayload({ id: "comp-3" })));
            store.dispatch(
                SystemActions.createConnection(
                    createConnection({
                        id: "conn-1",
                        from: createConnectionAnchor({ id: "comp-1" }),
                        to: createConnectionAnchor({ id: "comp-2" }),
                    })
                )
            );
            store.dispatch(
                SystemActions.createConnection(
                    createConnection({
                        id: "conn-2",
                        from: createConnectionAnchor({ id: "comp-1" }),
                        to: createConnectionAnchor({ id: "comp-3" }),
                    })
                )
            );
            store.dispatch(EditorActions.selectComponent("comp-1"));
        };

        const recalculateFlags = (store: EditorStore): (boolean | undefined)[] => [
            store.getState().system.connections.entities["conn-1"]?.recalculate,
            store.getState().system.connections.entities["conn-2"]?.recalculate,
        ];

        it("re-flags the whole batch once after every member reported, then stops", () => {
            const { result, store } = renderUseEditor(seedHubWithTwoConnections);

            act(() => {
                result.current.updateConnectionsOfComponent();
            });
            expect(recalculateFlags(store)).toEqual([true, true]);

            // First pass: nothing re-flags until the last member reports.
            act(() => {
                result.current.connectionRecalculated("conn-1", [0, 0, 10, 0], []);
            });
            expect(recalculateFlags(store)).toEqual([false, true]);

            act(() => {
                result.current.connectionRecalculated("conn-2", [0, 5, 10, 5], []);
            });
            expect(recalculateFlags(store)).toEqual([true, true]);

            // Second pass: reporting clears the flags for good — no third pass.
            act(() => {
                result.current.connectionRecalculated("conn-1", [0, 0, 10, 0], []);
                result.current.connectionRecalculated("conn-2", [0, 5, 10, 5], []);
            });
            expect(recalculateFlags(store)).toEqual([false, false]);
        });

        it("does not re-flag a single-connection batch", () => {
            const { result, store } = renderUseEditor((store) => {
                store.dispatch(SystemActions.createComponent(createComponentPayload({ id: "comp-1" })));
                store.dispatch(SystemActions.createComponent(createComponentPayload({ id: "comp-2" })));
                store.dispatch(
                    SystemActions.createConnection(
                        createConnection({
                            id: "conn-1",
                            from: createConnectionAnchor({ id: "comp-1" }),
                            to: createConnectionAnchor({ id: "comp-2" }),
                        })
                    )
                );
                store.dispatch(EditorActions.selectComponent("comp-1"));
            });

            act(() => {
                result.current.updateConnectionsOfComponent();
            });
            expect(store.getState().system.connections.entities["conn-1"]?.recalculate).toBe(true);

            act(() => {
                result.current.connectionRecalculated("conn-1", [0, 0, 10, 0], []);
            });
            expect(store.getState().system.connections.entities["conn-1"]?.recalculate).toBe(false);
        });
    });

    // removeAssetFromPointOfAttack only removes an asset that is actually attached
    describe("removeAssetFromPointOfAttack", () => {
        it("removes an attached asset and ignores an unattached one", () => {
            const { result, store } = renderUseEditor((store) => {
                store.dispatch(PointsOfAttackActions.createPointOfAttack(createPointOfAttack({ id: "poa-1" })));
                store.dispatch(PointsOfAttackActions.setPointOfAttack({ id: "poa-1", changes: { assets: [5] } }));
            });

            // Unattached asset: no change.
            act(() => {
                result.current.removeAssetFromPointOfAttack(
                    createAsset({ id: 7 }),
                    createPointOfAttack({ id: "poa-1", assets: [5] })
                );
            });
            expect(store.getState().system.pointsOfAttack.entities["poa-1"]?.assets).toEqual([5]);

            // Attached asset: removed.
            act(() => {
                result.current.removeAssetFromPointOfAttack(
                    createAsset({ id: 5 }),
                    createPointOfAttack({ id: "poa-1", assets: [5] })
                );
            });
            expect(store.getState().system.pointsOfAttack.entities["poa-1"]?.assets).toEqual([]);
        });
    });
});
