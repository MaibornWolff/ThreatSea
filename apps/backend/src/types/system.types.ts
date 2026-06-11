export interface UpdateSystemRequest {
    data: SystemData | null;
    image?: string | null;
}

export interface SystemResponse {
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
    annotations?: Annotation[];
    defaultAnnotationColor?: string | null;
    lastAutoSaveDate: string;
}

interface BaseAnnotation {
    id: string;
    projectId: number;
    x: number;
    y: number;
    rotation?: number;
    stroke: string;
    strokeWidth: number;
    fill?: string;
}

interface RectAnnotation extends BaseAnnotation {
    type: "rect";
    width: number;
    height: number;
}

interface CircleAnnotation extends BaseAnnotation {
    type: "circle";
    radius: number;
}

interface LineAnnotation extends BaseAnnotation {
    type: "line";
    points: number[];
}

interface ArrowAnnotation extends BaseAnnotation {
    type: "arrow";
    points: number[];
}

interface FreehandAnnotation extends BaseAnnotation {
    type: "freehand";
    points: number[];
}

interface TextAnnotation extends BaseAnnotation {
    type: "text";
    width: number;
    height: number;
    text: string;
    fontSize?: number;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
}

type Annotation =
    | RectAnnotation
    | CircleAnnotation
    | LineAnnotation
    | ArrowAnnotation
    | FreehandAnnotation
    | TextAnnotation;

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

interface ConnectionAnchor {
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

interface ConnectionPointMeta {
    position: Coordinate;
    goesHorizontal: boolean;
    goesLeft: boolean;
    goesUp: boolean;
    pointOfAttack: PointOfAttack | null;
}

interface Coordinate {
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
    description?: string;
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
