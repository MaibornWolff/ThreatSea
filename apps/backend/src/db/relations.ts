import { relations } from "drizzle-orm/relations";
import {
    projects,
    assets,
    catalogs,
    catalogMeasures,
    catalogThreats,
    componentTypes,
    threats,
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
    threats: many(threats),
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
    threats: many(threats),
}));

export const componentTypesRelations = relations(componentTypes, ({ one }) => ({
    project: one(projects, {
        fields: [componentTypes.projectId],
        references: [projects.id],
    }),
}));

export const measureImpactsRelations = relations(measureImpacts, ({ one }) => ({
    threat: one(threats, {
        fields: [measureImpacts.threatId],
        references: [threats.id],
    }),
    measure: one(measures, {
        fields: [measureImpacts.measureId],
        references: [measures.id],
    }),
}));

export const threatsRelations = relations(threats, ({ one, many }) => ({
    measureImpacts: many(measureImpacts),
    catalogThreat: one(catalogThreats, {
        fields: [threats.catalogThreatId],
        references: [catalogThreats.id],
    }),
    project: one(projects, {
        fields: [threats.projectId],
        references: [projects.id],
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
