/**
 * @module threats.api - Defines mock data
 *     for the threats of a project.
 */

const THREATS_DATA = [
    {
        id: 1,
        createdAt: "2020-02-06",
        name: "Test1",

        description:
            "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.",
        catalogThreatId: 5,
        attacker: "UNAUTHORISED_PARTIES",
        probability: 3,
        confidentiality: true,
        integrity: false,
        availability: true,
        pointOfAttack: {
            id: "sd4g64d6g4sd6g4",
            name: "Kundendaten-Server",
            type: "DATA_STORAGE_INFRASTRUCTURE",
            assets: [
                {
                    id: 1,
                    name: "Asset 1",
                    confidentiality: 2,
                    integrity: 3,
                    availability: 1,
                },
                {
                    id: 2,
                    name: "Asset 2",
                    confidentiality: 2,
                    integrity: 3,
                    availability: 4,
                },
            ],
        },
    },
    {
        id: 2,
        createdAt: "2020-01-05",
        name: "Test2",
        description:
            "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.",
        catalogThreatId: 3,
        attacker: "UNAUTHORISED_PARTIES",
        probability: 2,
        confidentiality: true,
        integrity: false,
        availability: true,
        pointOfAttack: {
            id: "sd4g64d6g4sd6g4",
            name: "Kundendaten-Server",
            type: "DATA_STORAGE_INFRASTRUCTURE",
            assets: [
                {
                    id: 1,
                    name: "Asset 1",
                    confidentiality: 2,
                    integrity: 3,
                    availability: 5,
                },
                {
                    id: 2,
                    name: "Asset 2",
                    confidentiality: 2,
                    integrity: 3,
                    availability: 4,
                },
                {
                    id: 5,
                    name: "Asset 2",
                    confidentiality: 2,
                    integrity: 3,
                    availability: 4,
                },
            ],
        },
    },
];

const getThreats = () =>
    new Promise((resolve) => {
        setTimeout(() => {
            resolve(THREATS_DATA);
        }, 2000);
    });

export const threatsApiMock = {
    getThreats,
};
