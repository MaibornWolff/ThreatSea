/**
 * @module system.api - Defines mock data
 *     for the system.
 */

import serverImg from "../../images/server.png";
import databaseImg from "../../images/database.png";
import desktopImg from "../../images/desktop.png";
import userImg from "../../images/user.png";

const SYSTEM_DATA = {
    components: [
        {
            id: 1,
            x: 400,
            y: 50,
            width: 50,
            height: 50,
            symbol: userImg,
        },
        {
            id: 2,
            x: 250,
            y: 250,
            width: 50,
            height: 50,
            symbol: desktopImg,
        },
        {
            id: 3,
            x: 50,
            y: 50,
            width: 50,
            height: 50,
            symbol: databaseImg,
        },
        {
            id: 4,
            x: 550,
            y: 50,
            width: 50,
            height: 50,
            symbol: serverImg,
        },
    ],
    connections: [
        {
            id: 1,
            from: {
                id: 1,
                anchor: "bottom",
            },
            to: {
                id: 2,
                anchor: "top",
            },
        },
        {
            id: 2,
            from: {
                id: 3,
                anchor: "bottom",
            },
            to: {
                id: 1,
                anchor: "bottom",
            },
        },
    ],
};

const getSystem = () =>
    new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                system: SYSTEM_DATA,
            });
        }, 2000);
    });

export const systemApiMock = {
    getSystem,
};
