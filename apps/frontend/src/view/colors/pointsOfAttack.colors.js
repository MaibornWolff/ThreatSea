import { POINTS_OF_ATTACK } from "../../api/types/points-of-attack.types";

export const POA_COLORS = {
    [POINTS_OF_ATTACK.USER_BEHAVIOUR]: {
        normal: "#ff68bd",
        selected: "#c9318d",
        hover: "#c9318d",
    },
    [POINTS_OF_ATTACK.USER_INTERFACE]: {
        normal: "#ffa75f",
        selected: "#c87832",
        hover: "#c87832",
    },
    [POINTS_OF_ATTACK.PROCESSING_INFRASTRUCTURE]: {
        normal: "#8d5ad3",
        selected: "#5b2da1",
        hover: "#5b2da1",
    },
    [POINTS_OF_ATTACK.DATA_STORAGE_INFRASTRUCTURE]: {
        normal: "#f1d200",
        selected: "#baa100",
        hover: "#baa100",
    },
    [POINTS_OF_ATTACK.COMMUNICATION_INFRASTRUCTURE]: {
        normal: "#5786ff",
        selected: "#005acb",
        hover: "#005acb",
    },
    [POINTS_OF_ATTACK.COMMUNICATION_INTERFACES]: {
        normal: "#92e0fb",
        selected: "#5faec8",
        hover: "#5faec8",
    },
};
