import type { Asset } from "#api/types/asset.types.ts";
import type { CatalogMeasure } from "#api/types/catalog-measure.types.ts";
import type { CatalogThreat } from "#api/types/catalog-threat.types.ts";
import type { CatalogWithRole } from "#api/types/catalogs.types.ts";
import type { ComponentType } from "#api/types/component-types.types.ts";
import type { MeasureImpact } from "#api/types/measure-impact.types.ts";
import type { Measure } from "#api/types/measure.types.ts";
import type { ExtendedProject } from "#api/types/project.types.ts";
import type { System } from "#api/types/system.types.ts";

export interface ProjectExport {
    datamodelVersion: number;
    project: ExtendedProject;
    assets: Asset[];
    system: System | null;
    catalog: CatalogWithRole | null;
    catalogThreats: CatalogThreat[];
    catalogMeasures: CatalogMeasure[];
    componentTypes: ComponentType[];
    measures: Measure[];
    threats: ExtendedProject[];
    measureImpacts: MeasureImpact[];
}
