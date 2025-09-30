import { SystemData } from "#types/system.types.js";
import { sql } from "drizzle-orm";
import {
    boolean,
    check,
    index,
    integer,
    jsonb,
    pgEnum,
    pgTable,
    text,
    timestamp,
    unique,
    uniqueIndex,
    varchar,
} from "drizzle-orm/pg-core";
import { LANGUAGES } from "#types/languages.type.js";
import { ATTACKERS } from "#types/attackers.types.js";
import { CONFIDENTIALITY_LEVELS } from "#types/confidentiality-levels.types.js";
import { POINTS_OF_ATTACK } from "#types/points-of-attack.types.js";
import { USER_ROLES } from "#types/user-roles.types.js";

type DefaultFields = "id" | "createdAt" | "updatedAt";

export const LanguagesEnum = pgEnum("language", LANGUAGES);

export const UserRolesEnum = pgEnum("user_role", USER_ROLES);

export const AttackersEnum = pgEnum("attacker", ATTACKERS);

export const ConfidentialityLevelsEnum = pgEnum("confidentiality_level", CONFIDENTIALITY_LEVELS);

export const PointsOfAttackEnum = pgEnum("point_of_attack", POINTS_OF_ATTACK);

export type CreateAsset = Omit<typeof assets.$inferInsert, DefaultFields>;
export type UpdateAsset = Omit<CreateAsset, "projectId">;
export type Asset = typeof assets.$inferSelect;
export const assets = pgTable(
    "assets",
    {
        id: integer().notNull().primaryKey().generatedByDefaultAsIdentity(),
        name: varchar({ length: 255 }).notNull(),
        description: text().notNull(),
        confidentiality: integer().notNull(),
        integrity: integer().notNull(),
        availability: integer().notNull(),
        confidentialityJustification: text().notNull(),
        integrityJustification: text().notNull(),
        availabilityJustification: text().notNull(),
        createdAt: timestamp({ mode: "string", withTimezone: true })
            .notNull()
            .default(sql`now()`),
        updatedAt: timestamp({ mode: "string", withTimezone: true })
            .notNull()
            .default(sql`now()`),
        projectId: integer()
            .notNull()
            .references(() => projects.id, { onDelete: "cascade", onUpdate: "cascade" }),
    },
    (table) => [
        check("assets_name_not_empty", sql`${table.name} <> ''`),
        check("assets_confidentiality_min_max", sql`${table.confidentiality} between 1 and 5`),
        check("assets_integrity_min_max", sql`${table.integrity} between 1 and 5`),
        check("assets_availability_min_max", sql`${table.availability} between 1 and 5`),
        index("assets_project_id").on(table.projectId),
        index("assets_name").on(table.name),
    ]
);

export type CreateCatalog = Omit<typeof catalogs.$inferInsert, DefaultFields>;
export type UpdateCatalog = Omit<CreateCatalog, "language">;
export type Catalog = typeof catalogs.$inferSelect;
export const catalogs = pgTable(
    "catalogs",
    {
        id: integer().notNull().primaryKey().generatedByDefaultAsIdentity(),
        name: varchar({ length: 255 }).notNull(),
        language: LanguagesEnum().notNull(),
        createdAt: timestamp({ mode: "string", withTimezone: true })
            .notNull()
            .default(sql`now()`),
        updatedAt: timestamp({ mode: "string", withTimezone: true })
            .notNull()
            .default(sql`now()`),
    },
    (table) => [check("catalogs_name_not_empty", sql`${table.name} <> ''`), index("catalogs_name").on(table.name)]
);

export type CreateCatalogMeasure = Omit<typeof catalogMeasures.$inferInsert, DefaultFields>;
export type UpdateCatalogMeasure = Omit<CreateCatalogMeasure, "catalogId">;
export type CatalogMeasure = typeof catalogMeasures.$inferSelect;
export const catalogMeasures = pgTable(
    "catalog_measures",
    {
        id: integer().notNull().primaryKey().generatedByDefaultAsIdentity(),
        name: varchar({ length: 255 }).notNull(),
        description: text().notNull(),
        pointOfAttack: PointsOfAttackEnum().notNull(),
        attacker: AttackersEnum().notNull(),
        probability: integer(),
        confidentiality: boolean().notNull(),
        integrity: boolean().notNull(),
        availability: boolean().notNull(),
        createdAt: timestamp({ mode: "string", withTimezone: true })
            .notNull()
            .default(sql`now()`),
        updatedAt: timestamp({ mode: "string", withTimezone: true })
            .notNull()
            .default(sql`now()`),
        catalogId: integer()
            .notNull()
            .references(() => catalogs.id, { onDelete: "cascade", onUpdate: "cascade" }),
    },
    (table) => [
        check("catalog_measures_probability_min_max", sql`${table.probability} between 1 and 5`),
        index("catalog_measures_catalog_id").on(table.catalogId),
        index("catalog_measures_name").on(table.name),
        index("catalog_measures_point_of_attack").on(table.pointOfAttack),
        index("catalog_measures_attacker").on(table.attacker),
    ]
);

export type CreateCatalogThreat = Omit<typeof catalogThreats.$inferInsert, DefaultFields>;
export type UpdateCatalogThreat = Omit<CreateCatalogThreat, "catalogId">;
export type CatalogThreat = typeof catalogThreats.$inferSelect;
export const catalogThreats = pgTable(
    "catalog_threats",
    {
        id: integer().notNull().primaryKey().generatedByDefaultAsIdentity(),
        name: varchar({ length: 255 }).notNull(),
        description: text().notNull(),
        pointOfAttack: PointsOfAttackEnum().notNull(),
        attacker: AttackersEnum().notNull(),
        probability: integer().notNull(),
        confidentiality: boolean().notNull(),
        integrity: boolean().notNull(),
        availability: boolean().notNull(),
        createdAt: timestamp({ mode: "string", withTimezone: true })
            .notNull()
            .default(sql`now()`),
        updatedAt: timestamp({ mode: "string", withTimezone: true })
            .notNull()
            .default(sql`now()`),
        catalogId: integer()
            .notNull()
            .references(() => catalogs.id, { onDelete: "cascade", onUpdate: "cascade" }),
    },
    (table) => [
        check("catalog_threats_probability_min_max", sql`${table.probability} between 1 and 5`),
        index("catalog_threats_catalog_id").on(table.catalogId),
        index("catalog_threats_name").on(table.name),
        index("catalog_threats_point_of_attack").on(table.pointOfAttack),
        index("catalog_threats_attacker").on(table.attacker),
    ]
);

export type ComponentType = typeof componentTypes.$inferSelect;
export type CreateComponentType = Omit<typeof componentTypes.$inferInsert, DefaultFields>;
export type UpdateComponentType = Omit<CreateComponentType, "projectId">;

export const componentTypes = pgTable(
    "component_types",
    {
        id: integer().notNull().primaryKey().generatedByDefaultAsIdentity(),
        name: varchar({ length: 255 }).notNull(),
        pointsOfAttack: PointsOfAttackEnum().array().notNull(),
        symbol: text(),
        createdAt: timestamp({ mode: "string", withTimezone: true })
            .notNull()
            .default(sql`now()`),
        updatedAt: timestamp({ mode: "string", withTimezone: true })
            .notNull()
            .default(sql`now()`),
        projectId: integer()
            .notNull()
            .references(() => projects.id, { onDelete: "cascade", onUpdate: "cascade" }),
    },
    (table) => [index("component_types_project_id").on(table.projectId)]
);

export type CreateMeasureImpact = Omit<typeof measureImpacts.$inferInsert, DefaultFields>;
export type UpdateMeasureImpact = Omit<CreateMeasureImpact, "threatId" | "measureId">;
export type MeasureImpact = typeof measureImpacts.$inferSelect;

export const measureImpacts = pgTable(
    "measure_impacts",
    {
        id: integer().notNull().primaryKey().generatedByDefaultAsIdentity(),
        description: text().notNull(),
        setsOutOfScope: boolean().notNull(),
        impactsProbability: boolean().notNull(),
        impactsDamage: boolean().notNull(),
        probability: integer(),
        damage: integer(),
        createdAt: timestamp({ mode: "string", withTimezone: true })
            .notNull()
            .default(sql`now()`),
        updatedAt: timestamp({ mode: "string", withTimezone: true })
            .notNull()
            .default(sql`now()`),
        threatId: integer()
            .notNull()
            .references(() => threats.id, { onDelete: "cascade", onUpdate: "cascade" }),
        measureId: integer()
            .notNull()
            .references(() => measures.id, { onDelete: "cascade", onUpdate: "cascade" }),
    },
    (table) => [
        unique("measure_impacts_measure_id_threat_id_unique").on(table.measureId, table.threatId),
        check("measure_impacts_probability_min_max", sql`${table.probability} between 1 and 5`),
        check(
            "measure_impacts_probability",
            sql`${table.impactsProbability} = false OR ${table.probability} IS NOT NULL`
        ),
        check("measure_impacts_damage_min_max", sql`${table.damage} between 1 and 5`),
        check("measure_impacts_damage", sql`${table.impactsDamage} = false OR ${table.damage} IS NOT NULL`),
        index("measure_impacts_measure_id_threat_id").on(table.measureId, table.threatId),
    ]
);

export type Measure = typeof measures.$inferSelect;
export type CreateMeasure = Omit<typeof measures.$inferInsert, DefaultFields>;
export type UpdateMeasure = Omit<CreateMeasure, "projectId" | "catalogMeasureId">;
export const measures = pgTable(
    "measures",
    {
        id: integer().notNull().primaryKey().generatedByDefaultAsIdentity(),
        name: varchar({ length: 255 }).notNull(),
        description: text().notNull(),
        scheduledAt: timestamp({ mode: "string", withTimezone: true }).notNull(),
        catalogMeasureId: integer().references(() => catalogMeasures.id, { onDelete: "set null", onUpdate: "cascade" }),
        createdAt: timestamp({ mode: "string", withTimezone: true })
            .notNull()
            .default(sql`now()`),
        updatedAt: timestamp({ mode: "string", withTimezone: true })
            .notNull()
            .default(sql`now()`),
        projectId: integer()
            .notNull()
            .references(() => projects.id, { onDelete: "cascade", onUpdate: "cascade" }),
    },
    (table) => [
        check("measures_name_not_empty", sql`${table.name} <> ''`),
        index("measures_catalog_measure_id").on(table.catalogMeasureId),
        index("measures_project_id").on(table.projectId),
    ]
);

export type Project = typeof projects.$inferSelect;
export type CreateProject = Omit<typeof projects.$inferInsert, DefaultFields>;
export type UpdateProject = Omit<CreateProject, "catalogId">;

export const projects = pgTable(
    "projects",
    {
        id: integer().notNull().primaryKey().generatedByDefaultAsIdentity(),
        name: varchar({ length: 255 }).notNull(),
        description: text().notNull(),
        confidentialityLevel: ConfidentialityLevelsEnum().notNull().default(CONFIDENTIALITY_LEVELS.INTERNAL),
        lineOfToleranceGreen: integer().notNull().default(6),
        lineOfToleranceRed: integer().notNull().default(15),
        createdAt: timestamp({ mode: "string", withTimezone: true })
            .notNull()
            .default(sql`now()`),
        updatedAt: timestamp({ mode: "string", withTimezone: true })
            .notNull()
            .default(sql`now()`),
        catalogId: integer()
            .notNull()
            .references(() => catalogs.id, { onUpdate: "cascade" }),
    },
    (table) => [
        check("projects_name_not_empty", sql`${table.name} <> ''`),
        index("projects_catalog_id").on(table.catalogId),
        index("projects_name").on(table.name),
    ]
);

export type System = typeof systems.$inferSelect;
export type CreateSystem = Omit<System, DefaultFields>;
export type UpdateSystem = Omit<CreateSystem, "projectId">;

export const systems = pgTable(
    "systems",
    {
        id: integer().notNull().primaryKey().generatedByDefaultAsIdentity(),
        data: jsonb().$type<SystemData>(),
        image: text(),
        createdAt: timestamp({ mode: "string", withTimezone: true })
            .notNull()
            .default(sql`now()`),
        updatedAt: timestamp({ mode: "string", withTimezone: true })
            .notNull()
            .default(sql`now()`),
        projectId: integer()
            .notNull()
            .references(() => projects.id, { onDelete: "cascade", onUpdate: "cascade" }),
    },
    (table) => [unique("project_id").on(table.projectId)]
);

export type Threat = typeof threats.$inferSelect;
export type CreateThreat = Omit<typeof threats.$inferInsert, DefaultFields>;
export type UpdateThreat = Omit<CreateThreat, "pointOfAttackId" | "pointOfAttack" | "attacker" | "catalogThreatId">;

export const threats = pgTable(
    "threats",
    {
        id: integer().notNull().primaryKey().generatedByDefaultAsIdentity(),
        pointOfAttackId: varchar({ length: 21 }).notNull(),
        name: varchar({ length: 255 }).notNull(),
        description: text().notNull(),
        pointOfAttack: PointsOfAttackEnum().notNull(),
        attacker: AttackersEnum().notNull(),
        probability: integer().notNull(),
        confidentiality: boolean().notNull(),
        integrity: boolean().notNull(),
        availability: boolean().notNull(),
        doneEditing: boolean().notNull(),
        createdAt: timestamp({ mode: "string", withTimezone: true })
            .notNull()
            .default(sql`now()`),
        updatedAt: timestamp({ mode: "string", withTimezone: true })
            .notNull()
            .default(sql`now()`),
        catalogThreatId: integer()
            .notNull()
            .references(() => catalogThreats.id, { onDelete: "cascade", onUpdate: "cascade" }),
        projectId: integer()
            .notNull()
            .references(() => projects.id, { onDelete: "cascade", onUpdate: "cascade" }),
    },
    (table) => [
        check("threats_name_not_empty", sql`${table.name} <> ''`),
        check("threats_probability_min_max", sql`${table.probability} between 1 and 5`),
        index("threats_catalog_threat_id").on(table.catalogThreatId),
        index("threats_project_id").on(table.projectId),
    ]
);

export type Token = typeof tokens.$inferSelect;

export const tokens = pgTable(
    "tokens",
    {
        id: integer().notNull().primaryKey().generatedByDefaultAsIdentity(),
        token: varchar({ length: 500 }).notNull(),
        expiresAt: integer().notNull(),
        createdAt: timestamp({ mode: "string", withTimezone: true })
            .notNull()
            .default(sql`now()`),
    },
    (table) => [index("tokens_token").on(table.token)]
);

export type User = typeof users.$inferSelect;
export const users = pgTable(
    "users",
    {
        id: integer().notNull().primaryKey().generatedByDefaultAsIdentity(),
        firstname: varchar({ length: 255 }).notNull(),
        lastname: varchar({ length: 255 }).notNull(),
        email: varchar({ length: 255 }).notNull(),
        createdAt: timestamp({ mode: "string", withTimezone: true })
            .notNull()
            .default(sql`now()`),
        updatedAt: timestamp({ mode: "string", withTimezone: true })
            .notNull()
            .default(sql`now()`),
    },
    (table) => [index("users_email").on(table.email)]
);

export type UserCatalog = typeof usersCatalogs.$inferSelect;
export type NewUserCatalog = typeof usersCatalogs.$inferInsert;
export const usersCatalogs = pgTable(
    "users_catalogs",
    {
        role: UserRolesEnum().notNull(),
        createdAt: timestamp({ mode: "string", withTimezone: true })
            .notNull()
            .default(sql`now()`),
        updatedAt: timestamp({ mode: "string", withTimezone: true })
            .notNull()
            .default(sql`now()`),
        userId: integer()
            .notNull()
            .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
        catalogId: integer()
            .notNull()
            .references(() => catalogs.id, { onDelete: "cascade", onUpdate: "cascade" }),
    },
    (table) => [
        index("users_catalogs_catalog_id").on(table.catalogId),
        uniqueIndex("users_catalogs_user_id_catalog_id").on(table.userId, table.catalogId),
    ]
);

export const usersProjects = pgTable(
    "users_projects",
    {
        role: UserRolesEnum().notNull(),
        createdAt: timestamp({ mode: "string", withTimezone: true })
            .notNull()
            .default(sql`now()`),
        updatedAt: timestamp({ mode: "string", withTimezone: true })
            .notNull()
            .default(sql`now()`),
        userId: integer()
            .notNull()
            .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
        projectId: integer()
            .notNull()
            .references(() => projects.id, { onDelete: "cascade", onUpdate: "cascade" }),
    },
    (table) => [
        index("users_projects_project_id").on(table.projectId),
        uniqueIndex("users_projects_user_id_project_id").on(table.userId, table.projectId),
    ]
);
