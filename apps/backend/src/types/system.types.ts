import { Type } from "class-transformer";
import { IsArray, IsString, Matches, MaxLength, ValidateIf, ValidateNested } from "class-validator";
import {
    FIELD_MUST_BE_ARRAY_MESSAGE,
    FIELD_MUST_BE_STRING_MESSAGE,
    FIELD_MUST_BE_VALID_IMAGE_DATA,
    MAX_SYMBOL_LENGTH,
    STRING_TOO_LONG_MESSAGE,
    SYSTEM_COMPONENT_SYMBOL_PATTERN,
} from "#middlewares/input-validations/validator-messages.js";

export interface UpdateSystemRequest {
    data: SystemData | null;
    image?: string | null;
}

/**
 * Validation DTOs for the system PUT body.
 *
 * They deliberately validate only the security-sensitive field — each placed component's
 * uploaded `symbol` — and rely on `plainToInstance` preserving every other property
 * (connections, annotations, coordinates, …) untouched, so the controller still receives the
 * full system payload. This DTO is what turns AC #2 ("upload is checked for security") into a
 * server-side guarantee: without it the save path stores arbitrary `symbol` strings unchecked,
 * while the componentTypes path is already validated.
 */
export class ComponentDto {
    // Restrict only embedded data: URLs to safe PNG/JPEG (blocking svg/script payloads); reference
    // paths and null/empty pass through so legacy diagrams keep saving. See SYSTEM_COMPONENT_SYMBOL_PATTERN.
    @ValidateIf((_, value) => value != null && value !== "")
    @IsString({ message: FIELD_MUST_BE_STRING_MESSAGE("symbol") })
    @MaxLength(MAX_SYMBOL_LENGTH, { message: STRING_TOO_LONG_MESSAGE("symbol", MAX_SYMBOL_LENGTH) })
    @Matches(SYSTEM_COMPONENT_SYMBOL_PATTERN, { message: FIELD_MUST_BE_VALID_IMAGE_DATA("symbol") })
    symbol?: string;
}

export class SystemDataDto {
    @ValidateIf((_, value) => value != null)
    @IsArray({ message: FIELD_MUST_BE_ARRAY_MESSAGE("components") })
    @ValidateNested({ each: true })
    @Type(() => ComponentDto)
    components?: ComponentDto[];
}

export class UpdateSystemRequestDto {
    @ValidateIf((_, value) => value != null)
    @ValidateNested()
    @Type(() => SystemDataDto)
    data?: SystemDataDto | null;

    // `image` (the full-canvas PNG snapshot) is intentionally left unvalidated here: it is a large
    // generated data URL that can legitimately exceed MAX_SYMBOL_LENGTH, and the global
    // express.json({ limit: "10mb" }) already bounds the request size.
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
    pinned?: boolean;
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
