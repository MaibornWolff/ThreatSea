/**
 * @module system-socket.api - Defines
 *     the socket io connection.
 */
import io from "socket.io-client";
import { API_URI } from "#api/utils.ts";

export const socket = io(API_URI);
