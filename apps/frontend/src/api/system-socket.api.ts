/**
 * @module system-socket.api - Disables socket operations globally
 */

/* eslint-disable no-empty-function */
export const socket = {
    emit: () => {},
    on: () => {},
    off: () => {},
    volatile: {
        emit: () => {},
    },
};
