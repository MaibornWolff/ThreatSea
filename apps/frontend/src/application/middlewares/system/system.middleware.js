import { batch } from "react-redux";
import { checkUserRole, USER_ROLES } from "../../../api/types/user-roles.types";
import { translationUtil } from "../../../utils/translations";
import { AlertActions } from "../../actions/alert.actions";
import { EditorActions } from "../../actions/editor.actions";
import { PointsOfAttackActions } from "../../actions/points-of-attack.actions";
import { SystemActions } from "../../actions/system.actions";
import { ProjectsActions } from "../../actions/projects.actions";

const filterProps = (item, filterProps = []) => {
    return Object.keys(item)
        .filter((key) => !filterProps.includes(key))
        .reduce((obj, key) => {
            obj[key] = item[key];
            return obj;
        }, {});
};

const handleSaveSystem =
    ({ dispatch, getState }) =>
    (next) =>
    (action) => {
        next(action);

        if (
            checkUserRole(getState().projects.current.role, USER_ROLES.EDITOR) &&
            SystemActions.saveSystem.match(action)
        ) {
            const { projectId, image } = action.payload;
            const { system, editor } = getState();
            const { id, connections, components, pointsOfAttack, connectionPoints } = system;
            const { lastAutoSaveDate } = editor;
            const data = {
                image,
                data: {
                    connections: Object.values(connections.entities)
                        .filter((item) => item.projectId === projectId)
                        .map((item) => {
                            return filterProps(item, ["visible"]);
                        }),
                    components: Object.values(components.entities)
                        .filter((item) => item.projectId === projectId)
                        .map((item) => {
                            return filterProps(item, ["alwaysShowAnchors"]);
                        }),
                    pointsOfAttack: Object.values(pointsOfAttack.entities).filter(
                        (item) => item.projectId === projectId
                    ),
                    connectionPoints: Object.values(connectionPoints.entities).filter(
                        (item) => item.projectId === projectId
                    ),
                    lastAutoSaveDate: lastAutoSaveDate,
                },
            };
            if (id) {
                data.id = id;
            }
            dispatch(EditorActions.setAutoSaveStatus("saving"));
            dispatch(EditorActions.setAutoSaveText(""));
            dispatch(
                SystemActions.updateSystem({
                    projectId,
                    ...data,
                })
            )
                .unwrap()
                .then((result) => {
                    if (!result) {
                        // Server error
                        dispatch(EditorActions.setAutoSaveStatus("failed"));
                        dispatch(
                            EditorActions.setAutoSaveText(
                                translationUtil.t("editorPage:autoSave.failed", {
                                    error: result.message,
                                })
                            )
                        );
                    }
                })
                .catch((error) => {
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

const handleUpdateSystemSuccesful =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        next(action);
        if (SystemActions.updateSystem.fulfilled.match(action)) {
            dispatch(SystemActions.setHasChanged(false));
            dispatch(ProjectsActions.getProjects());
        }
    };

const handleUpdateSystemFailed =
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

const handleGetSystemFailed =
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

const compareComponents = (component1, component2) => {
    return (
        component1.id === component2.id &&
        component1.name === component2.name &&
        component1.gridX === component2.gridX &&
        component1.gridY === component2.gridY &&
        component1.x === component2.x &&
        component1.y === component2.y
    );
};

const compareConnections = (connection1, connection2) => {
    return (
        connection1.id === connection2.id &&
        connection1.recalculate === connection2.recalculate &&
        JSON.stringify([...connection1.waypoints].sort()) === JSON.stringify([...connection2.waypoints].sort())
    );
};

const handleUserDidSomething =
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

const handleSuccessfulRequest =
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
            const { blockAutoSave, lastAutoSaveDate } = editor;

            const components = Object.values(system.components.entities).filter(
                (component) => component.projectId === action.payload.projectId
            );
            const actionComponents = action.payload.data.components;

            const connections = Object.values(system.connections.entities).filter(
                (connection) => connection.projectId === action.payload.projectId
            );
            const actionConnections = action.payload.data.connections;

            // Check Components
            let equal = components.length == actionComponents.length;
            for (let i = 0; i < components.length && equal; i++) {
                const actionComponent = actionComponents.filter((component) => component.id === components[i].id)[0];
                if (!actionComponent || !compareComponents(actionComponent, components[i])) {
                    equal = false;
                }
            }

            // Check Connections
            equal = equal && connections.length === actionConnections.length;
            for (let i = 0; i < connections.length && equal; i++) {
                const actionConnection = actionConnections.filter(
                    (connection) => connection.id === connections[i].id
                )[0];
                if (!actionConnection || !compareConnections(actionConnection, connections[i])) {
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

const systemMiddlewares = [
    handleSuccessfulRequest,
    handleGetSystemFailed,
    handleSaveSystem,
    handleUpdateSystemSuccesful,
    handleUpdateSystemFailed,
    handleUserDidSomething,
];

export default systemMiddlewares;
