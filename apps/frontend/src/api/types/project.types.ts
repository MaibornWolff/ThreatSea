import type { CONFIDENTIALITY_LEVELS } from "#utils/confidentiality.ts";
import type { Asset } from "#api/types/asset.types.ts";
import type { ATTACKERS } from "#api/types/attackers.types.ts";
import type { MeasureImpact } from "#api/types/measure-impact.types.ts";
import type { Measure } from "#api/types/measure.types.ts";
import type { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import type { STANDARD_COMPONENT_TYPES } from "#api/types/standard-component.types.ts";
import type { Threat } from "#api/types/threat.types.ts";
import type { USER_ROLES } from "#api/types/user-roles.types.ts";
import type { MatrixColorKey } from "#view/colors/matrix.ts";

export interface CreateProjectRequest {
    catalogId: number;
    name: string;
    description: string;
    confidentialityLevel: CONFIDENTIALITY_LEVELS;
    lineOfToleranceGreen?: number;
    lineOfToleranceRed?: number;
}

export type UpdateProjectRequest = Partial<Omit<CreateProjectRequest, "catalogId">> & { id: number };

export interface Project {
    id: number;
    catalogId: number;
    name: string;
    description?: string;
    confidentialityLevel: CONFIDENTIALITY_LEVELS;
    lineOfToleranceGreen: number;
    lineOfToleranceRed: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ExtendedProject extends Project {
    role: USER_ROLES;
    image: string | null;
}

export interface ProjectReport {
    systemImage: string | null;
    project: Project;
    assets: (Asset & { reportId: string })[];
    threats: (Threat & {
        componentName: string | null;
        componentType: number | STANDARD_COMPONENT_TYPES | null;
        interfaceName: string | null;
        damage: number;
        risk: number;
        attacker: ATTACKERS;
        pointOfAttack: POINTS_OF_ATTACK;
        assets: { name: string | undefined; id: number; reportId: string | undefined }[];
        measures: (MeasureImpact & {
            reportId: string | undefined;
            name: string | undefined;
            scheduledAt: string | undefined;
        })[];
        netProbability: number;
        netDamage: number;
        netRisk: number;
        reportId: string;
        id: number;
        bruttoColor: MatrixColorKey;
        nettoColor: MatrixColorKey;
    })[];
    measures: (Measure & {
        threats: { id: number; reportId: string | undefined; name: string | undefined }[];
    })[];
    measureImpacts: (MeasureImpact & { measureReportId: string | undefined; threatReportId: string | undefined })[];
}

export type ThreatReport = ProjectReport["threats"][number];

export type IndexCallback = (pageNumber: number, chapterName: string, chapterId: string) => void;

export interface IndexEntry {
    chapterName: string;
    chapterId: string;
    pageNumber: number;
}

export type Index = Record<string, IndexEntry>;
