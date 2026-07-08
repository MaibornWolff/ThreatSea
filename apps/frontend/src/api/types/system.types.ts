import type { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import type { STANDARD_COMPONENT_TYPES } from "#api/types/standard-component.types.ts";

export interface UpdateSystemRequest {
    projectId: number;
    data: SystemData | null;
    image?: string | null;
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
    annotations?: Annotation[];
    defaultAnnotationColor?: string | null;
    lastAutoSaveDate: string;
}

export type AnnotationType = "rect" | "circle" | "line" | "arrow" | "freehand" | "text";

export const DEFAULT_TEXT_FONT_SIZE = 16;

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

export interface RectAnnotation extends BaseAnnotation {
    type: "rect";
    width: number;
    height: number;
}

export interface CircleAnnotation extends BaseAnnotation {
    type: "circle";
    radius: number;
}

export interface LineAnnotation extends BaseAnnotation {
    type: "line";
    points: number[];
}

export interface ArrowAnnotation extends BaseAnnotation {
    type: "arrow";
    points: number[];
}

export interface FreehandAnnotation extends BaseAnnotation {
    type: "freehand";
    points: number[];
}

export interface TextAnnotation extends BaseAnnotation {
    type: "text";
    width: number;
    height: number;
    text: string;
    fontSize?: number;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
}

export type Annotation =
    | RectAnnotation
    | CircleAnnotation
    | LineAnnotation
    | ArrowAnnotation
    | FreehandAnnotation
    | TextAnnotation;

export type AnnotationInput =
    | Omit<RectAnnotation, "id" | "projectId">
    | Omit<CircleAnnotation, "id" | "projectId">
    | Omit<LineAnnotation, "id" | "projectId">
    | Omit<ArrowAnnotation, "id" | "projectId">
    | Omit<FreehandAnnotation, "id" | "projectId">
    | Omit<TextAnnotation, "id" | "projectId">;

export type AnnotationChanges =
    | ({ type: "rect" } & Partial<Omit<RectAnnotation, "type" | "id" | "projectId">>)
    | ({ type: "circle" } & Partial<Omit<CircleAnnotation, "type" | "id" | "projectId">>)
    | ({ type: "line" } & Partial<Omit<LineAnnotation, "type" | "id" | "projectId">>)
    | ({ type: "arrow" } & Partial<Omit<ArrowAnnotation, "type" | "id" | "projectId">>)
    | ({ type: "freehand" } & Partial<Omit<FreehandAnnotation, "type" | "id" | "projectId">>)
    | ({ type: "text" } & Partial<Omit<TextAnnotation, "type" | "id" | "projectId">>);

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

export interface SystemConnection extends Connection {
    visible?: boolean;
    communicationInterfaceId?: string | null;
    communicationInterface: string | null;
}

export interface ConnectionAnchor {
    id: string;
    anchor: AnchorOrientation;
    type: STANDARD_COMPONENT_TYPES | number;
    name?: string | null;
    communicationInterfaceId?: string | null;
}

export enum AnchorOrientation {
    left = "left",
    top = "top",
    right = "right",
    bottom = "bottom",
    center = "center",
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
    type: POINTS_OF_ATTACK;
    componentId: string | null;
    connectionId: string | null;
    projectId: number;
    connectionPointId: string | null;
    assets: number[];
}

export interface SystemPointOfAttack extends PointOfAttack {
    componentName: string | null;
}

export interface Component {
    id: string;
    name: string;
    description?: string;
    type: STANDARD_COMPONENT_TYPES | number;
    x: number;
    y: number;
    gridX: number;
    gridY: number;
    width: number;
    height: number;
    selected: boolean;
    projectId: number;
    symbol: string | null;
}

export interface SystemCommunicationInterface {
    id: string;
    name: string | null;
    icon?: string | null;
    type: string;
    projectId: number;
    componentId: string;
    componentName?: string | null;
}

export interface SystemComponent extends Component {
    communicationInterfaces?: SystemCommunicationInterface[];
    alwaysShowAnchors?: boolean;
}

export type ConnectionEndpointWithComponent = ConnectionAnchor & { component: SystemComponent | undefined };

export type AugmentedSystemComponent = SystemComponent & { pointsOfAttack: SystemPointOfAttack[] };

export interface ConnectionPoint {
    id: string;
    name: string;
    connectionId: string;
    projectId: number;
}
