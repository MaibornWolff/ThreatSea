import { batch } from "react-redux";
import type { AppMiddleware } from "../types";
import { checkUserRole, USER_ROLES } from "../../../api/types/user-roles.types";
import { translationUtil } from "../../../utils/translations";
import { AlertActions } from "../../actions/alert.actions";
import { EditorActions } from "../../actions/editor.actions";
import { PointsOfAttackActions } from "../../actions/points-of-attack.actions";
import { SystemActions } from "../../actions/system.actions";
import { ProjectsActions } from "../../actions/projects.actions";
import type { Connection, SystemComponent, SystemConnection, UpdateSystemRequest } from "#api/types/system.types.ts";
import type { EditorState } from "#application/reducers/editor.reducer.ts";

const handleSaveSystem: AppMiddleware =
    ({ dispatch, getState }) =>
    (next) =>
    (action) => {
        next(action);

        if (
            checkUserRole(getState().projects.current?.role, USER_ROLES.EDITOR) &&
            SystemActions.saveSystem.match(action)
        ) {
            const { projectId, image } = action.payload;
            const { system, editor } = getState();
            const { id, connections, components, pointsOfAttack, connectionPoints } = system;
            const { lastAutoSaveDate } = editor;
            const data: UpdateSystemRequest = {
                projectId,
                image,
                data: {
                    connections: Object.values(connections.entities)
                        .filter((item) => item.projectId === projectId)
                        .map((connection) => ({ ...connection, visible: undefined })),
                    components: Object.values(components.entities)
                        .filter((item) => item.projectId === projectId)
                        .map((component) => ({ ...component, alwaysShowAnchors: undefined })),
                    pointsOfAttack: Object.values(pointsOfAttack.entities).filter(
                        (item) => item.projectId === projectId
                    ),
                    connectionPoints: Object.values(connectionPoints.entities).filter(
                        (item) => item.projectId === projectId
                    ),
                    lastAutoSaveDate,
                },
            };
            // TODO: Is id legacy? Should this check be removed/altered? As far as I can see it is not needed.
            if (id) {
                (data as UpdateSystemRequest & { id: number | null }).id = id;
            }
            dispatch(EditorActions.setAutoSaveStatus("saving"));
            dispatch(EditorActions.setAutoSaveText(""));
            dispatch(SystemActions.updateSystem(data))
                .unwrap()
                .then((result) => {
                    if (!result) {
                        // Server error
                        dispatch(EditorActions.setAutoSaveStatus("failed"));
                        dispatch(
                            EditorActions.setAutoSaveText(
                                translationUtil.t("editorPage:autoSave.failed", {
                                    error: (result as { message?: string } | undefined)?.message ?? "",
                                })
                            )
                        );
                    }
                })
                .catch((error: Error) => {
                    dispatch(EditorActions.setAutoSaveStatus("failed"));
                    dispatch(
                        EditorActions.setAutoSaveText(
                            translationUtil.t("editorPage:autoSave.failed", {
                                error: error.message,
                            })
                        )
                    );
                });
        }
    };

const handleUpdateSystemSuccesful: AppMiddleware =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        next(action);
        if (SystemActions.updateSystem.fulfilled.match(action)) {
            dispatch(SystemActions.setHasChanged(false));
            dispatch(ProjectsActions.getProjects());
        }
    };

const handleUpdateSystemFailed: AppMiddleware =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        next(action);
        if (SystemActions.updateSystem.rejected.match(action)) {
            dispatch(
                AlertActions.openErrorAlert({
                    text: "Failed to save the system",
                })
            );
        }
    };

const handleGetSystemFailed: AppMiddleware =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        next(action);
        if (SystemActions.getSystem.rejected.match(action)) {
            dispatch(
                AlertActions.openErrorAlert({
                    text: "Failed to load the system",
                    duration: 5000,
                })
            );
        }
    };

const compareComponents = (component1: SystemComponent, component2: SystemComponent | undefined): boolean => {
    if (!component2) {
        return false;
    }
    return (
        component1.id === component2.id &&
        component1.name === component2.name &&
        component1.gridX === component2.gridX &&
        component1.gridY === component2.gridY &&
        component1.x === component2.x &&
        component1.y === component2.y
    );
};

const compareConnections = (connection1: Connection, connection2: SystemConnection | undefined): boolean => {
    if (!connection2) {
        return false;
    }
    return (
        connection1.id === connection2.id &&
        connection1.recalculate === connection2.recalculate &&
        JSON.stringify([...connection1.waypoints].sort()) === JSON.stringify([...connection2.waypoints].sort())
    );
};

const handleUserDidSomething: AppMiddleware =
    ({ dispatch, getState }) =>
    (next) =>
    (action) => {
        next(action);
        if (
            SystemActions.createComponent.match(action) ||
            SystemActions.createConnection.match(action) ||
            SystemActions.createConnectionPoint.match(action) ||
            SystemActions.setComponent.match(action) ||
            SystemActions.setComponentName.match(action) ||
            SystemActions.setConnection.match(action) ||
            SystemActions.setConnectionPoint.match(action) ||
            SystemActions.removeComponent.match(action) ||
            SystemActions.removeConnection.match(action) ||
            SystemActions.removeConnectionPoint.match(action) ||
            PointsOfAttackActions.createPointOfAttack.match(action) ||
            PointsOfAttackActions.setPointOfAttack.match(action) ||
            PointsOfAttackActions.removePointOfAttack.match(action)
        ) {
            const { editor } = getState();
            const { autoSaveStatus, lastAutoSaveDate } = editor;

            dispatch(EditorActions.makeAScreenshot());

            if (autoSaveStatus !== "notUpToDate" && autoSaveStatus !== "saving") {
                dispatch(EditorActions.setAutoSaveStatus("notUpToDate"));
                dispatch(
                    EditorActions.setAutoSaveText(
                        translationUtil.t("editorPage:autoSave.notUpToDate", {
                            date: lastAutoSaveDate,
                        })
                    )
                );
                dispatch(SystemActions.setAutoSavedBlocked(true));
            }
        }
    };

const handleSuccessfulRequest: AppMiddleware =
    ({ dispatch, getState }) =>
    (next) =>
    (action) => {
        next(action);
        if (SystemActions.getSystem.fulfilled.match(action)) {
            batch(() => {
                if (action.payload) {
                    const { data, id } = action.payload;

                    if (data) {
                        const { components, connections, connectionPoints, pointsOfAttack, lastAutoSaveDate } = data;
                        if (id) {
                            dispatch(SystemActions.setSystemId(id));
                        }
                        if (components) {
                            dispatch(SystemActions.setComponents(components));
                        }
                        if (connections) {
                            dispatch(SystemActions.setConnections(connections));
                        }
                        if (connectionPoints) {
                            dispatch(SystemActions.setConnectionPoints(connectionPoints));
                        }
                        if (pointsOfAttack) {
                            dispatch(PointsOfAttackActions.setPointsOfAttack(pointsOfAttack));
                        }
                        if (lastAutoSaveDate) {
                            dispatch(EditorActions.setLastAutoSaveDate(lastAutoSaveDate));
                        } else {
                            dispatch(EditorActions.setLastAutoSaveDate(""));
                        }
                    }
                } else {
                    dispatch(SystemActions.clearSystem());
                }

                const { editor } = getState();
                const { lastAutoSaveDate } = editor;

                dispatch(SystemActions.setPendingState(false));
                dispatch(SystemActions.setInitialized(true));
                dispatch(EditorActions.setAutoSaveStatus("upToDate"));
                dispatch(
                    EditorActions.setAutoSaveText(
                        translationUtil.t("editorPage:autoSave.upToDate", {
                            date: lastAutoSaveDate,
                        })
                    )
                );
            });
        } else if (SystemActions.updateSystem.fulfilled.match(action)) {
            const { system, editor } = getState();
            // TODO: Bug? Should blockAutoSave come from SystemState instead?
            const { blockAutoSave, lastAutoSaveDate } = editor as EditorState & { blockAutoSave?: boolean };

            const components = Object.values(system.components.entities).filter(
                (component) => component.projectId === action.payload.projectId
            );
            const actionComponents = action.payload.data?.components ?? [];

            const connections = Object.values(system.connections.entities).filter(
                (connection) => connection.projectId === action.payload.projectId
            );
            const actionConnections = action.payload.data?.connections ?? [];

            // Check Components
            let equal = components.length === actionComponents.length;
            for (let i = 0; i < components.length && equal; i++) {
                const component = components[i];
                const actionComponent = actionComponents.find((item) => item.id === component?.id);
                if (!actionComponent || !compareComponents(actionComponent, component)) {
                    equal = false;
                }
            }

            // Check Connections
            equal = equal && connections.length === actionConnections.length;
            for (let i = 0; i < connections.length && equal; i++) {
                const connection = connections[i];
                const actionConnection = actionConnections.find((item) => item.id === connection?.id);
                if (!actionConnection || !compareConnections(actionConnection, connection)) {
                    equal = false;
                }
            }

            if (equal) {
                batch(() => {
                    dispatch(EditorActions.setAutoSaveStatus("upToDate"));
                    dispatch(
                        EditorActions.setAutoSaveText(
                            translationUtil.t("editorPage:autoSave.upToDate", {
                                date: lastAutoSaveDate,
                            })
                        )
                    );
                });
            } else {
                batch(() => {
                    dispatch(EditorActions.setAutoSaveStatus("notUpToDate"));
                    dispatch(
                        EditorActions.setAutoSaveText(
                            translationUtil.t("editorPage:autoSave.notUpToDate", {
                                date: lastAutoSaveDate,
                            })
                        )
                    );
                    dispatch(SystemActions.setAutoSavedBlocked(!blockAutoSave)); // Trigger another auto save
                });
            }
        }
    };

const systemMiddlewares: AppMiddleware[] = [
    handleSuccessfulRequest,
    handleGetSystemFailed,
    handleSaveSystem,
    handleUpdateSystemSuccesful,
    handleUpdateSystemFailed,
    handleUserDidSomething,
];

export default systemMiddlewares;
