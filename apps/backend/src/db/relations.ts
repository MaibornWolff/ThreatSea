import { relations } from "drizzle-orm/relations";
import {
    projects,
    assets,
    catalogs,
    catalogMeasures,
    catalogThreats,
    componentTypes,
    genericThreats,
    childThreats,
    measureImpacts,
    measures,
    systems,
    users,
    usersCatalogs,
    usersProjects,
} from "./schema.js";

export const assetsRelations = relations(assets, ({ one }) => ({
    project: one(projects, {
        fields: [assets.projectId],
        references: [projects.id],
    }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
    assets: many(assets),
    componentTypes: many(componentTypes),
    measures: many(measures),
    catalog: one(catalogs, {
        fields: [projects.catalogId],
        references: [catalogs.id],
    }),
    systems: one(systems),
    genericThreats: many(genericThreats),
    childThreats: many(childThreats),
    usersProjects: many(usersProjects),
}));

export const catalogMeasuresRelations = relations(catalogMeasures, ({ one, many }) => ({
    catalog: one(catalogs, {
        fields: [catalogMeasures.catalogId],
        references: [catalogs.id],
    }),
    measures: many(measures),
}));

export const catalogsRelations = relations(catalogs, ({ many }) => ({
    catalogMeasures: many(catalogMeasures),
    catalogThreats: many(catalogThreats),
    projects: many(projects),
    usersCatalogs: many(usersCatalogs),
}));

export const catalogThreatsRelations = relations(catalogThreats, ({ one, many }) => ({
    catalog: one(catalogs, {
        fields: [catalogThreats.catalogId],
        references: [catalogs.id],
    }),
    genericThreats: many(genericThreats),
}));

export const genericThreatsRelations = relations(genericThreats, ({ one, many }) => ({
    catalogThreat: one(catalogThreats, {
        fields: [genericThreats.catalogThreatId],
        references: [catalogThreats.id],
    }),
    project: one(projects, {
        fields: [genericThreats.projectId],
        references: [projects.id],
    }),
    childThreats: many(childThreats),
}));

export const childThreatsRelations = relations(childThreats, ({ one, many }) => ({
    genericThreat: one(genericThreats, {
        fields: [childThreats.genericThreatId],
        references: [genericThreats.id],
    }),
    project: one(projects, {
        fields: [childThreats.projectId],
        references: [projects.id],
    }),
    measureImpacts: many(measureImpacts),
}));

export const componentTypesRelations = relations(componentTypes, ({ one }) => ({
    project: one(projects, {
        fields: [componentTypes.projectId],
        references: [projects.id],
    }),
}));

export const measureImpactsRelations = relations(measureImpacts, ({ one }) => ({
    childThreat: one(childThreats, {
        fields: [measureImpacts.childThreatId],
        references: [childThreats.id],
    }),
    measure: one(measures, {
        fields: [measureImpacts.measureId],
        references: [measures.id],
    }),
}));

export const measuresRelations = relations(measures, ({ one, many }) => ({
    measureImpacts: many(measureImpacts),
    catalogMeasure: one(catalogMeasures, {
        fields: [measures.catalogMeasureId],
        references: [catalogMeasures.id],
    }),
    project: one(projects, {
        fields: [measures.projectId],
        references: [projects.id],
    }),
}));

export const systemsRelations = relations(systems, ({ one }) => ({
    project: one(projects, {
        fields: [systems.projectId],
        references: [projects.id],
    }),
}));

export const usersCatalogsRelations = relations(usersCatalogs, ({ one }) => ({
    user: one(users, {
        fields: [usersCatalogs.userId],
        references: [users.id],
    }),
    catalog: one(catalogs, {
        fields: [usersCatalogs.catalogId],
        references: [catalogs.id],
    }),
}));

export const usersRelations = relations(users, ({ many }) => ({
    usersCatalogs: many(usersCatalogs),
    usersProjects: many(usersProjects),
}));

export const usersProjectsRelations = relations(usersProjects, ({ one }) => ({
    user: one(users, {
        fields: [usersProjects.userId],
        references: [users.id],
    }),
    project: one(projects, {
        fields: [usersProjects.projectId],
        references: [projects.id],
    }),
}));
