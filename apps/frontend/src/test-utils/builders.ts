import type { Asset } from "#api/types/asset.types.ts";
import type { ExtendedProject } from "#api/types/project.types.ts";
import {
    AnchorOrientation,
    type AugmentedSystemComponent,
    type ConnectionAnchor,
    type SystemConnection,
    type SystemPointOfAttack,
} from "#api/types/system.types.ts";
import type { SystemConnectionPoint } from "#application/adapters/system-connection-point.adapter.ts";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import { STANDARD_COMPONENT_TYPES } from "#api/types/standard-component.types.ts";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { CONFIDENTIALITY_LEVELS } from "#utils/confidentiality.ts";

export const createAsset = (overrides: Partial<Asset> = {}): Asset => ({
    id: 1,
    name: "Test Asset",
    description: "",
    confidentiality: 3,
    integrity: 3,
    availability: 2,
    confidentialityJustification: "",
    integrityJustification: "",
    availabilityJustification: "",
    projectId: 1,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
});

export const createSystemComponent = (overrides: Partial<AugmentedSystemComponent> = {}): AugmentedSystemComponent => ({
    id: "comp-1",
    name: "Test Component",
    description: "",
    type: STANDARD_COMPONENT_TYPES.CLIENT,
    x: 0,
    y: 0,
    gridX: 0,
    gridY: 0,
    width: 100,
    height: 100,
    selected: true,
    projectId: 1,
    symbol: null,
    pointsOfAttack: [],
    ...overrides,
});

export const createPointOfAttack = (overrides: Partial<SystemPointOfAttack> = {}): SystemPointOfAttack => ({
    id: "poa-1",
    name: null,
    type: POINTS_OF_ATTACK.USER_INTERFACE,
    componentId: "comp-1",
    connectionId: null,
    projectId: 1,
    connectionPointId: null,
    assets: [],
    componentName: "Test Component",
    ...overrides,
});

export const createConnectionPoint = (overrides: Partial<SystemConnectionPoint> = {}): SystemConnectionPoint => ({
    id: "cp-1",
    name: "eth0",
    connectionId: "conn-1",
    projectId: 1,
    componentId: "comp-1",
    componentName: "Test Component",
    description: "",
    ...overrides,
});

export const createProject = (overrides: Partial<ExtendedProject> = {}): ExtendedProject => ({
    id: 1,
    catalogId: 1,
    name: "Test Project",
    confidentialityLevel: CONFIDENTIALITY_LEVELS.INTERNAL,
    lineOfToleranceGreen: 3,
    lineOfToleranceRed: 6,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    role: USER_ROLES.EDITOR,
    image: null,
    ...overrides,
});

export const createConnectionAnchor = (overrides: Partial<ConnectionAnchor> = {}) => ({
    id: "comp-1",
    anchor: AnchorOrientation.right,
    type: STANDARD_COMPONENT_TYPES.CLIENT,
    component: undefined,
    ...overrides,
});

export const createConnection = (overrides: Partial<SystemConnection> = {}): SystemConnection => ({
    id: "conn-1",
    name: "Test Connection",
    from: { id: "comp-1", anchor: AnchorOrientation.right, type: STANDARD_COMPONENT_TYPES.CLIENT },
    to: { id: "comp-2", anchor: AnchorOrientation.left, type: STANDARD_COMPONENT_TYPES.SERVER },
    connectionPoints: [],
    connectionPointsMeta: [],
    waypoints: [],
    recalculate: false,
    projectId: 1,
    visible: true,
    communicationInterfaceId: null,
    communicationInterface: null,
    ...overrides,
});
