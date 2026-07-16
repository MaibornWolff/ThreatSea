import type { Asset } from "#api/types/asset.types.ts";
import type { CatalogWithRole } from "#api/types/catalogs.types.ts";
import type { ExtendedProject, ProjectReport, ThreatReport } from "#api/types/project.types.ts";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import type { Measure } from "#api/types/measure.types.ts";
import type { MeasureImpact } from "#api/types/measure-impact.types.ts";
import type { ThreatMeasure } from "#application/hooks/use-threat-measures-list.hook.ts";
import {
    AnchorOrientation,
    type Annotation,
    type AnnotationType,
    type AugmentedSystemComponent,
    type Component,
    type ConnectionAnchor,
    type SystemCommunicationInterface,
    type SystemConnection,
    type SystemPointOfAttack,
} from "#api/types/system.types.ts";
import type { SystemConnectionPoint } from "#application/adapters/system-connection-point.adapter.ts";
import type { AugmentedSystemConnection } from "#application/selectors/system.selectors.ts";
import { ATTACKERS } from "#api/types/attackers.types.ts";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import { STANDARD_COMPONENT_TYPES } from "#api/types/standard-component.types.ts";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { CONFIDENTIALITY_LEVELS } from "#utils/confidentiality.ts";
import { DEFAULT_ANNOTATION_COLOR } from "#view/colors/annotation.colors.ts";
import type { Milestone } from "#utils/report-risk.ts";

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

export const createThreat = (overrides: Partial<ExtendedThreat> = {}): ExtendedThreat => ({
    id: 1,
    pointOfAttackId: "poa-1",
    catalogThreatId: 1,
    name: "Test Threat",
    description: "",
    pointOfAttack: POINTS_OF_ATTACK.USER_INTERFACE,
    attacker: ATTACKERS.UNAUTHORISED_PARTIES,
    probability: 3,
    confidentiality: true,
    integrity: false,
    availability: false,
    doneEditing: false,
    projectId: 1,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    componentName: "Test Component",
    componentType: null,
    interfaceName: null,
    assets: [],
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

export const createComponentPayload = (
    overrides: Partial<Omit<Component, "width" | "height" | "selected">> = {}
): Omit<Component, "width" | "height" | "selected"> => ({
    id: "comp-1",
    name: "Test Component",
    type: STANDARD_COMPONENT_TYPES.CLIENT,
    x: 0,
    y: 0,
    gridX: 0,
    gridY: 0,
    projectId: 1,
    symbol: null,
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

export const createCommunicationInterface = (
    overrides: Partial<SystemCommunicationInterface> = {}
): SystemCommunicationInterface => ({
    id: "ci-1",
    name: "REST API",
    icon: null,
    type: POINTS_OF_ATTACK.COMMUNICATION_INTERFACES,
    projectId: 1,
    componentId: "comp-1",
    componentName: "Test Component",
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

export const createCatalog = (overrides: Partial<CatalogWithRole> = {}): CatalogWithRole => ({
    id: 1,
    name: "Test Catalog",
    language: "EN",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    role: USER_ROLES.EDITOR,
    ...overrides,
});

export const createConnectionAnchor = (
    overrides: Partial<ConnectionAnchor> & { communicationInterfaceId?: string | null } = {}
) => ({
    id: "comp-1",
    anchor: AnchorOrientation.right,
    type: STANDARD_COMPONENT_TYPES.CLIENT,
    ...overrides,
});

const ANNOTATION_VARIANT_DEFAULTS: Record<AnnotationType, Record<string, unknown>> = {
    rect: { width: 100, height: 100 },
    circle: { radius: 50 },
    line: { points: [0, 0, 100, 100] },
    arrow: { points: [0, 0, 100, 100] },
    freehand: { points: [0, 0, 50, 50, 100, 100] },
    text: { width: 100, height: 100, text: "" },
};

// `Extract<Annotation, { type: T }>` picks the variant whose discriminant
// matches T (e.g. T = "text" → TextAnnotation). Lets the builder return the
// specific variant the caller asked for instead of the wide Annotation union.
export function createAnnotation<T extends AnnotationType>(
    overrides: Partial<Extract<Annotation, { type: T }>> & { type: T }
): Extract<Annotation, { type: T }> {
    return {
        id: "ann-1",
        projectId: 1,
        x: 0,
        y: 0,
        stroke: DEFAULT_ANNOTATION_COLOR,
        strokeWidth: 3,
        ...ANNOTATION_VARIANT_DEFAULTS[overrides.type],
        ...overrides,
    } as unknown as Extract<Annotation, { type: T }>;
}

export const createMeasure = (overrides: Partial<Measure> = {}): Measure => ({
    id: 1,
    name: "Test Measure",
    description: "",
    scheduledAt: "2025-01-01",
    projectId: 1,
    catalogMeasureId: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
});

export const createReportMilestone = (overrides: Partial<Milestone> = {}): Milestone & { active: boolean } => ({
    scheduledAt: "2025-01-01",
    matrix: null,
    barGraph: null,
    active: false,
    ...overrides,
});

export const createMeasureImpact = (overrides: Partial<MeasureImpact> = {}): MeasureImpact => ({
    id: 1,
    measureId: 1,
    threatId: 1,
    description: "",
    setsOutOfScope: false,
    impactsProbability: false,
    impactsDamage: false,
    probability: null,
    damage: null,
    projectId: 1,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
});

export const createThreatMeasure = (overrides: Partial<ThreatMeasure> = {}): ThreatMeasure => ({
    measureImpactId: 1,
    setsOutOfScope: false,
    netProbability: null,
    netDamage: null,
    measureId: 1,
    measureName: "Test Measure",
    measureScheduleAt: "2025-01-01",
    threatName: "Test Threat",
    measure: createMeasure(),
    measureImpact: createMeasureImpact(),
    ...overrides,
});

type ReportThreatMeasure = ThreatReport["measures"][number];
type ReportMeasure = ProjectReport["measures"][number];

export const createReportThreatMeasure = (overrides: Partial<ReportThreatMeasure> = {}): ReportThreatMeasure => ({
    ...createMeasureImpact(),
    reportId: "M-01",
    name: "Test Measure",
    scheduledAt: "2025-01-01T00:00:00.000Z",
    ...overrides,
});

export const createReportThreat = (overrides: Partial<ThreatReport> = {}): ThreatReport => ({
    id: 1,
    pointOfAttackId: "poa-1",
    catalogThreatId: 1,
    name: "Test Threat",
    description: "",
    pointOfAttack: POINTS_OF_ATTACK.USER_INTERFACE,
    attacker: ATTACKERS.UNAUTHORISED_PARTIES,
    probability: 4,
    confidentiality: false,
    integrity: false,
    availability: false,
    doneEditing: true,
    projectId: 1,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    componentName: null,
    componentType: null,
    componentReportId: null,
    interfaceName: null,
    damage: 5,
    risk: 20,
    assets: [],
    measures: [],
    netProbability: 4,
    netDamage: 5,
    netRisk: 20,
    reportId: "T-01",
    bruttoColor: "red",
    nettoColor: "red",
    ...overrides,
});

export const createReportMeasure = (overrides: Partial<ReportMeasure> = {}): ReportMeasure => ({
    ...createMeasure(),
    threats: [],
    ...overrides,
});

export const createProjectReport = (overrides: Partial<ProjectReport> = {}): ProjectReport => ({
    systemImage: null,
    project: createProject(),
    components: [],
    assets: [],
    threats: [],
    measures: [],
    measureImpacts: [],
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
    pinned: false,
    ...overrides,
});

export const createAugmentedConnection = (
    overrides: {
        id?: string;
        fromComponent?: AugmentedSystemComponent;
        toComponent?: AugmentedSystemComponent;
        pointsOfAttack?: SystemPointOfAttack[];
        waypoints?: number[];
    } = {}
): AugmentedSystemConnection => {
    const fromComponent = overrides.fromComponent ?? createSystemComponent({ id: "comp-1" });
    const toComponent = overrides.toComponent ?? createSystemComponent({ id: "comp-2" });
    const base = createConnection({
        ...(overrides.id !== undefined ? { id: overrides.id } : {}),
        from: { id: fromComponent.id, anchor: AnchorOrientation.right, type: fromComponent.type },
        to: { id: toComponent.id, anchor: AnchorOrientation.left, type: toComponent.type },
        ...(overrides.waypoints !== undefined ? { waypoints: overrides.waypoints } : {}),
    });
    return {
        ...base,
        from: { ...base.from, component: fromComponent },
        to: { ...base.to, component: toComponent },
        pointsOfAttack: overrides.pointsOfAttack ?? [],
    };
};
