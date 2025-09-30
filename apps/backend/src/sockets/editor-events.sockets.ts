/**
 * @module editor-events.sockets - Defines the events
 *     of the system view.
 */
import { Socket } from "socket.io";
import { Component, Connection } from "#types/system.types.js";
import { SocketUser } from "#sockets/events.sockets.js";
import { executeActionIfRoleGrantsAccess } from "#sockets/user-events.sockets.js";
import { USER_ROLES } from "#types/user-roles.types.js";

/**
 * Initializes the socket events for the system page.
 *
 * @param {Socket} socket - socket.io socket.
 */
export function initEditorEvents(socket: Socket, user: SocketUser) {
    /**
     * Event handler when a component in the system view is created.
     *
     * Emits to the current project room.
     *
     * @param {Component} component - component that has been created
     */
    socket.on("create_component", (component: Component) => {
        if (user.projectId === undefined || user.projectId !== component.projectId) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.to(component.projectId.toString()).emit("create_component", component);
            },
            "project",
            USER_ROLES.EDITOR,
            user
        );
    });

    /**
     * Event handler when a component in the system view is moved.
     *
     * Emits to the current project room.
     *
     * @param {Component} component - component that has been moved
     */
    socket.on("set_component", (component: Component) => {
        if (user.projectId === undefined || user.projectId !== component.projectId) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.to(component.projectId.toString()).emit("set_component", component);
            },
            "project",
            USER_ROLES.EDITOR,
            user
        );
    });

    /**
     * Event handler when a component in the system view is renamed.
     *
     * Emits to the current project room.
     *
     * @param {object} componentData - JSON Object that holds the new name
     * and id of the component.
     */
    socket.on("set_component_name", (componentData: { id: string; name: string }) => {
        if (user.projectId === undefined) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.to(user.projectId!.toString()).emit("set_component_name", componentData);
            },
            "project",
            USER_ROLES.EDITOR,
            user
        );
    });

    /**
     * Event handler when a component in the system view is getting
     * connected with another one (the lines from the plus sign).
     *
     * Emits to the current project room.
     *
     * @param {object} data - JSON Object that holds the move data
     * of the anchoring lines.
     */
    socket.on("set_component_anchor_visibility", (data: { id: string; alwaysShowAnchors: boolean }) => {
        if (user.projectId === undefined) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.to(user.projectId!.toString()).emit("set_component_anchor_visibility", data);
            },
            "project",
            USER_ROLES.EDITOR,
            user
        );
    });

    /**
     * Event handler when a component in the system view is removed.
     *
     * Emits to the current project room.
     *
     * @param {object} data - JSON Object that holds the
     *     id of the component.
     */
    socket.on("remove_component", (data: { id: string }) => {
        if (user.projectId === undefined) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.to(user.projectId!.toString()).emit("remove_component", data);
            },
            "project",
            USER_ROLES.EDITOR,
            user
        );
    });

    /**
     * Event handler when a communication interface is created.
     *
     * Emits to the current project room.
     *
     * @param {object} data - JSON Object that holds the data
     *     of the connection.
     */
    socket.on("create_connection_point", (data: { id: string; connectionId: string; projectId: number }) => {
        if (user.projectId === undefined || user.projectId !== data.projectId) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.to(user.projectId!.toString()).emit("create_connection_point", data);
            },
            "project",
            USER_ROLES.EDITOR,
            user
        );
    });

    /**
     * Event handler when the communication interface is renamed.
     *
     * Emits to the current project room.
     *
     * @param {object} data - JSON Object that holds the data
     *     of the communication interface.
     */
    socket.on("set_connection_point_name", (data: { id: string; name: string }) => {
        if (user.projectId === undefined) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.to(user.projectId!.toString()).emit("set_connection_point_name", data);
            },
            "project",
            USER_ROLES.EDITOR,
            user
        );
    });

    /**
     * Event handler when a communication interface is removed.
     *
     * Emits to the current project room.
     *
     * @param {object} data - JSON Object that holds the data
     *     of the communication interface.
     */
    socket.on("remove_connection_point", (data: { id: string }) => {
        if (user.projectId === undefined) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.to(user.projectId!.toString()).emit("remove_connection_point", data);
            },
            "project",
            USER_ROLES.EDITOR,
            user
        );
    });

    /**
     * Event handler when a connection is created.
     *
     * Emits to the current project room.
     *
     * @param {Connection} connection - connection that has been created
     */
    socket.on("create_connection", (connection: Connection) => {
        if (user.projectId === undefined || user.projectId !== connection.projectId) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.to(connection.projectId.toString()).emit("create_connection", connection);
            },
            "project",
            USER_ROLES.EDITOR,
            user
        );
    });

    /**
     * Event handler when a connection is created.
     *
     * Emits to the current project room.
     *
     * @param {object} data - JSON Object that holds the data
     *     of the connection in the system view and the interfaces etc.
     */
    socket.on("set_connection", (data: { id: string; recalculate: boolean }) => {
        if (user.projectId === undefined) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.to(user.projectId!.toString()).emit("set_connection", data);
            },
            "project",
            USER_ROLES.EDITOR,
            user
        );
    });

    /**
     * Event handler when a connection is renamed.
     *
     * Emits to the current project room.
     *
     * @param {object} data - JSON Object that holds the
     *     new name and id of the connection
     */
    socket.on("set_connection_name", (data: { id: string; name: string }) => {
        if (user.projectId === undefined) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.to(user.projectId!.toString()).emit("set_connection_name", data);
            },
            "project",
            USER_ROLES.EDITOR,
            user
        );
    });

    socket.on("set_connection_visibility", (data: { id: string; visible: boolean }) => {
        if (user.projectId === undefined) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.to(user.projectId!.toString()).emit("set_connection_visibility", data);
            },
            "project",
            USER_ROLES.EDITOR,
            user
        );
    });

    /**
     * Event handler when a connection is removed
     *
     * Emits to the current project room.
     *
     * @param {string} data - JSON Object that holds the
     *     connection id.
     */
    socket.on("remove_connection", (data: { id: string }) => {
        if (user.projectId === undefined) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.to(user.projectId!.toString()).emit("remove_connection", data);
            },
            "project",
            USER_ROLES.EDITOR,
            user
        );
    });

    socket.on("refresh_system", () => {
        if (user.projectId === undefined) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.to(user.projectId!.toString()).emit("refresh_system");
            },
            "project",
            USER_ROLES.EDITOR,
            user
        );
    });

    interface MouseData {
        x: number;
        y: number;
        layer: {
            x: number;
            y: number;
        };
        stageScale: number;
        stage: {
            x: number;
            y: number;
        };
    }
    /**
     * Event handler when a the mouse cursor is moved.
     *
     * Emits to the current project room.
     *
     * @param {MouseData} data - JSON Object string that holds the
     *     data of the mouse cursor.
     */
    socket.on("set_mouse_pointer", (data: MouseData) => {
        if (user.projectId === undefined) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.to(user.projectId!.toString()).emit("set_mouse_pointer", { ...data, id: socket.id });
            },
            "project",
            USER_ROLES.VIEWER,
            user
        );
    });

    /**
     * Event handler when a component is moved and the
     * connection lines are read.
     *
     * Emits to the current project room.
     *
     * @param {object} data - JSON Object that holds the
     *     data of the dragged component.
     */
    socket.on(
        "add_component_connection_line",
        (data: {
            id: string;
            draggedComponentId: string;
            draggedComponentAnchor: string;
            otherComponentId: string;
            otherComponentAnchor: string;
        }) => {
            if (user.projectId === undefined) {
                return;
            }

            executeActionIfRoleGrantsAccess(
                () => {
                    socket.to(user.projectId!.toString()).emit("add_component_connection_line", data);
                },
                "project",
                USER_ROLES.EDITOR,
                user
            );
        }
    );

    /**
     * Event handler when a component is moved and the
     * old connection lines are removed.
     *
     * Emits to the current project room.
     *
     * @param {object} data - JSON Object that holds the
     *     id of the connection line.
     */
    socket.on("remove_component_connection_line", (data: { id: string }) => {
        if (user.projectId === undefined) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.to(user.projectId!.toString()).emit("remove_component_connection_line", data);
            },
            "project",
            USER_ROLES.EDITOR,
            user
        );
    });

    socket.on("clear_component_connection_lines", () => {
        if (user.projectId === undefined) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.to(user.projectId!.toString()).emit("clear_component_connection_lines");
            },
            "project",
            USER_ROLES.EDITOR,
            user
        );
    });

    /**
     * Event handler when a component is moved. Readds the component to
     * it's new destination.
     *
     * Emits to the current project room.
     *
     * @param {object} data - JSON Object that holds the
     *     id of the component.
     */
    socket.on("add_component_in_use", (data: { id: string }) => {
        if (user.projectId === undefined) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.to(user.projectId!.toString()).emit("add_component_in_use", data);
            },
            "project",
            USER_ROLES.EDITOR,
            user
        );
    });

    /**
     * Event handler when a component is moved. Removes the old
     * component.
     *
     * Emits to the current project room.
     *
     * @param {object} data - JSON Object that holds the
     *     id of the component.
     */
    socket.on("remove_component_in_use", (data: { id: string }) => {
        if (user.projectId === undefined) {
            return;
        }

        executeActionIfRoleGrantsAccess(
            () => {
                socket.to(user.projectId!.toString()).emit("remove_component_in_use", data);
            },
            "project",
            USER_ROLES.EDITOR,
            user
        );
    });
}
