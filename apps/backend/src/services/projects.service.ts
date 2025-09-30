/**
 * Module that acts as a service for the projects.
 */
import { and, eq, getTableColumns } from "drizzle-orm";
import { db, TransactionType } from "#db/index.js";
import {
    Asset,
    CreateProject,
    Measure,
    MeasureImpact,
    Project,
    projects,
    Threat,
    UpdateProject,
    usersProjects,
} from "#db/schema.js";
import { ExtendedThreat, getThreats } from "#services/threats.service.js";
import { getPointsOfAttack } from "#services/points-of-attack.service.js";
import { findSystem } from "#services/system.service.js";
import { getAssets } from "#services/assets.service.js";
import { getMeasures } from "#services/measures.service.js";
import { getMeasureImpactsByProject } from "#services/measureImpacts.service.js";
import { USER_ROLES } from "#types/user-roles.types.js";

/**
 * Calculates the damage produced for the assets by a threat.
 *
 * @param {ExtendedThreat} threat - Data of the current threat.
 * @returns The max value of the security aspects of the assets.
 *     or 0 if none are specified.
 */
function calcDamage(threat: ExtendedThreat) {
    const { confidentiality, integrity, availability, assets } = threat;

    return assets.reduce((value, asset) => {
        if (confidentiality && value < asset.confidentiality) {
            value = asset.confidentiality;
        }
        if (integrity && value < asset.integrity) {
            value = asset.integrity;
        }
        if (availability && value < asset.availability) {
            value = asset.availability;
        }
        return value;
    }, 0); // default 0 if no protection goal is affected
}

/**
 * Transforms the threats with the given measures
 * and risk + damage produced.
 *
 * @param {object[]} threats - Data of the threats.
 * @param measuresWithIds
 * @param {object[]} assetsWithId - Assets with reportIds
 * @param {object[]} measureImpacts - measureImpacts of the Project
 * @returns Array of object of the transformed threat data.
 */
function transformThreats(
    threats: ExtendedThreat[],
    measuresWithIds: ExtendedMeasure[],
    assetsWithId: ExtendedAsset[],
    measureImpacts: MeasureImpact[]
) {
    return threats
        .map((threat) => {
            const { probability, attacker, pointOfAttack, assets } = threat;
            const matchedAssets = assets.map((threatAsset) => {
                const matchingAsset = assetsWithId.find((asset) => asset.id === threatAsset.id);
                return {
                    name: matchingAsset?.name,
                    id: matchingAsset?.id,
                    reportId: matchingAsset?.reportId,
                };
            });
            const threatMeasureImpacts = measureImpacts.filter((measureImpact) => measureImpact.threatId === threat.id);
            const measures = threatMeasureImpacts.map((measureImpact) => {
                const measure = measuresWithIds.find((measure) => measure.id === measureImpact.measureId);
                return {
                    ...measureImpact,
                    reportId: measure?.reportId,
                    name: measure?.name,
                    scheduledAt: measure?.scheduledAt,
                };
            });
            const damage = calcDamage(threat);
            const risk = probability * damage;
            return {
                ...threat,
                damage,
                risk,
                attacker,
                pointOfAttack,
                assets: matchedAssets,
                measures: measures.sort((a, b) => ((a.scheduledAt ?? "") < (b.scheduledAt ?? "") ? -1 : 1)),
            };
        })
        .map((threat) => {
            const [netProbability, netDamage] = threat.measures.reduce(
                (arr, measure) => {
                    const [netProbability, netDamage] = arr;
                    let { probability, damage } = measure;

                    if (!measure.impactsDamage) {
                        damage = netDamage;
                    }
                    if (!measure.impactsProbability) {
                        probability = netProbability;
                    }

                    probability = measure.setsOutOfScope ? 0 : (probability ?? 0);
                    damage = measure.setsOutOfScope ? 0 : (damage ?? 0);
                    return [
                        netProbability > probability ? probability : netProbability,
                        netDamage > damage ? damage : netDamage,
                    ];
                },
                [threat.probability, threat.damage]
            );
            const netRisk = netProbability * netDamage;
            return {
                ...threat,
                netProbability,
                netDamage,
                netRisk,
            };
        });
}

type TransformedMeasure = Measure & {
    threats: { id: number | undefined; reportId: string | undefined; name: string | undefined }[];
};

function transformMeasures(
    measures: Measure[],
    threats: (Threat & { reportId: string })[],
    measureImpacts: MeasureImpact[]
): TransformedMeasure[] {
    return measures.map((measure) => {
        const measureMeasureImpacts = measureImpacts.filter((measureImpact) => measureImpact.measureId === measure.id);
        const measureThreats = measureMeasureImpacts.map((measureImpact) => {
            const matchingThreat = threats.find((threat) => threat.id === measureImpact.threatId);
            return {
                id: matchingThreat?.id,
                reportId: matchingThreat?.reportId,
                name: matchingThreat?.name,
            };
        });
        return {
            ...measure,
            threats: measureThreats,
        };
    });
}

type ExtendedAsset = Asset & { reportId: string };
type ExtendedMeasure = Measure & { reportId: string };

/**
 * Fetches the necessary data for creating a report of
 * the selected project with its threats and resulting damage.
 *
 * @param {number} projectId - id of the current project.
 * @returns Object with the generated report data.
 */
export async function getReportData(projectId: number) {
    const measureReportIdsDict = new Map<number, string>();
    const threatReportIdsDict = new Map<number, string>();
    const assetsReportIdsDict = new Map<number, string>();
    // Gets current project.
    const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) });

    // Gets parsed system.
    const system = await findSystem(projectId);

    // Gets the images of the parsed system.
    const { image = null } = system || {};

    // Get all the threats of the project.
    let threats = await getThreats(projectId);

    const pointsOfAttack = await getPointsOfAttack(projectId);

    threats = threats.map((threat) => {
        const pointOfAttack = pointsOfAttack.find((pointOfAttack) => pointOfAttack.id === threat.pointOfAttackId);

        if (pointOfAttack?.type === "COMMUNICATION_INTERFACES") {
            threat.componentName = pointOfAttack.componentName + " > " + pointOfAttack.name;
        }

        return threat;
    });

    //Get all the assets of the project
    const assets = await getAssets(projectId);
    const assetsWithIds = assets
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((asset, index) => {
            assetsReportIdsDict.set(asset.id, "A." + (index + 1));
            return {
                ...asset,
                reportId: assetsReportIdsDict.get(asset.id)!,
            };
        });

    // Fetches the planned measures.
    const measures = await getMeasures(projectId);
    const measuresWithIds = measures
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((measure, index) => {
            measureReportIdsDict.set(measure.id, "M." + (index + 1));
            return {
                ...measure,
                reportId: measureReportIdsDict.get(measure.id)!,
            };
        });

    let measureImpacts = await getMeasureImpactsByProject(projectId);
    measureImpacts = measureImpacts.filter((measureImpact) =>
        threats.some((threat) => threat.id === measureImpact.threatId)
    );

    const threatsWithIds = transformThreats(threats, measuresWithIds, assetsWithIds, measureImpacts)
        .sort((a, b) => b.netRisk - a.netRisk)
        .map((threat, index) => {
            threatReportIdsDict.set(threat.id, "T." + (index + 1));
            return {
                ...threat,
                reportId: threatReportIdsDict.get(threat.id)!,
            };
        });

    const measureImpactsWithIds = measureImpacts.map((measureImpact) => {
        return {
            ...measureImpact,
            measureReportId: measureReportIdsDict.get(measureImpact.measureId),
            threatReportId: threatReportIdsDict.get(measureImpact.threatId),
        };
    });

    return {
        systemImage: image,
        project: project,
        assets: assetsWithIds,
        threats: threatsWithIds,
        measures: transformMeasures(measuresWithIds, threatsWithIds, measureImpacts),
        measureImpacts: measureImpactsWithIds,
    };
}

/**
 * Checks if a project exists in the database.
 *
 * @param projectId - The id of the project to check.
 * @returns {Promise<boolean>} A promise that resolves to true if the project exists, false otherwise.
 */
export async function checkProjectExists(projectId: number): Promise<boolean> {
    return (await db.query.projects.findFirst({ where: eq(projects.id, projectId) })) !== undefined;
}

/**
 * Creates a new project.
 *
 * @param userId - The id of the user who creates the project.
 * @param {CreateProject} createProjectData - The data of the project.
 * @param transaction - drizzle transaction
 * @returns {Promise<Project>} A promise that resolves to the created project.
 * @throws {Error} If the project could not be created.
 */
export async function createProject(
    userId: number,
    createProjectData: CreateProject,
    transaction: TransactionType | undefined = undefined
): Promise<Project> {
    return await (transaction ?? db).transaction(async (t) => {
        const [project] = await t.insert(projects).values(createProjectData).returning();

        if (!project) {
            throw new Error("Failed to create project");
        }

        await t.insert(usersProjects).values({
            userId: userId,
            projectId: project.id,
            role: USER_ROLES.OWNER,
        });

        return project;
    });
}

/**
 * Updates a project.
 *
 * @param {number} projectId - The id of the project.
 * @param {UpdateProject} updateProjectData - The data of the project.
 * @returns {Promise<Promise>} A promise that resolves to the updated project.
 * @throws {Error} If the project could not be updated.
 */
export async function updateProject(projectId: number, updateProjectData: UpdateProject): Promise<Project> {
    const [project] = await db.update(projects).set(updateProjectData).where(eq(projects.id, projectId)).returning();

    if (!project) {
        throw new Error("Failed to update project");
    }

    return project;
}

/**
 * Deletes a project.
 *
 * @param {number} projectId - The id of the project.
 * @returns {Promise<void>} A promise that resolves when the project is deleted.
 */
export async function deleteProject(projectId: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, projectId));
}

type ExtendedProject = Project & { role: USER_ROLES; image: string | null };

/**
 * Fetches the projects of threatsea with their system images.
 *
 * @returns The data of the projects as an array with its image.
 */
export async function getProjects(userId: number): Promise<ExtendedProject[]> {
    const selectedProjects: ExtendedProject[] = [];
    const items = await db
        .select({ ...getTableColumns(projects), role: usersProjects.role })
        .from(projects)
        .innerJoin(usersProjects, eq(projects.id, usersProjects.projectId))
        .where(eq(usersProjects.userId, userId));

    for (const project of items) {
        const system = await findSystem(project.id);

        selectedProjects.push({
            ...project,
            image: system?.image ?? null,
        });
    }

    return selectedProjects;
}

/**
 * Fetches a single project when joining via url into a project
 *
 * @param {number} projectId - id of the project
 * @param {number} userId - id of the user
 * @returns A single project.
 */
export async function getProject(projectId: number, userId: number): Promise<ExtendedProject | null> {
    const [project] = await db
        .select({ ...getTableColumns(projects), role: usersProjects.role })
        .from(projects)
        .innerJoin(usersProjects, eq(projects.id, usersProjects.projectId))
        .where(and(eq(projects.id, projectId), eq(usersProjects.userId, userId)));

    return project ? { ...project, image: null } : null;
}
