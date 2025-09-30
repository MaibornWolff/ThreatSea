import type { STANDARD_COMPONENT_TYPES } from "#api/types/standard-component.types.ts";

export interface UpdateSystemRequest {
    projectId: number;
    data: SystemData | null;
    image: string | null;
}

export interface System {
    id: number;
    projectId: number;
    data: SystemData | null;
    image: string | null;
}

export interface SystemData {
    connections: Connection[];
    components: Component[];
    pointsOfAttack: PointOfAttack[];
    connectionPoints: ConnectionPoint[];
    lastAutoSaveDate: string;
}

export interface Connection {
    id: string;
    name: string;
    from: ConnectionAnchor;
    to: ConnectionAnchor;
    /**
     * array of connection point IDs
     */
    connectionPoints: string[];
    connectionPointsMeta: ConnectionPointMeta[];
    waypoints: number[];
    recalculate: boolean;
    projectId: number;
}

export interface ConnectionAnchor {
    id: string;
    anchor: AnchorOrientation;
    type: STANDARD_COMPONENT_TYPES | number;
}

export enum AnchorOrientation {
    left = "left",
    top = "top",
    right = "right",
    bottom = "bottom",
}

export interface ConnectionPointMeta {
    position: Coordinate;
    goesHorizontal: boolean;
    goesLeft: boolean;
    goesUp: boolean;
    pointOfAttack: PointOfAttack | null;
}

export interface Coordinate {
    x: number;
    y: number;
}

export interface PointOfAttack {
    id: string;
    name: string | null;
    type: string;
    componentId: string | null;
    connectionId: string | null;
    projectId: number;
    connectionPointId: string | null;
    assets: number[];
}

export interface Component {
    id: string;
    name: string;
    type: STANDARD_COMPONENT_TYPES | number;
    x: number;
    y: number;
    gridX: number;
    gridY: number;
    width: number;
    height: number;
    selected: boolean;
    projectId: number;
    symbol: string;
}

export interface ConnectionPoint {
    id: string;
    name: string;
    connectionId: string;
    projectId: number;
}
