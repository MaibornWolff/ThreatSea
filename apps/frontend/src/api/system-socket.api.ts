/**
 * @module system-socket.api - Disables socket operations globally
 */

/*eslint no-empty-function: ["error", { "allow": ["functions"] }]*/
export const socket = {
    emit: {},
    on: {},
    volatile: {
        emit: {},
    },
};
