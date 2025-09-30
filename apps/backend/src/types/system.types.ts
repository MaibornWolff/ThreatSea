export interface UpdateSystemRequest {
    data: SystemData | null;
    image: string | null;
}

export interface SystemResponse extends UpdateSystemRequest {
    id: number;
    projectId: number;
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
    /**
     * ID of the component this anchor is set on
     */
    id: string;
    /**
     * orientation of the anchor around the component
     */
    anchor: AnchorOrientation;
    /**
     * type of the component this anchor is set on
     */
    type: ComponentType | number;
}

export enum AnchorOrientation {
    left = "left",
    top = "top",
    right = "right",
    bottom = "bottom",
}

export enum ComponentType {
    users = "USERS",
    client = "CLIENT",
    server = "SERVER",
    database = "DATABASE",
    communicationInfrastructure = "COMMUNICATION_INFRASTRUCTURE",
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
    type: ComponentType | number;
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
