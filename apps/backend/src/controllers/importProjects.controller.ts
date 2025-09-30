import { NextFunction, Request, Response } from "express";
import stringify from "json-stable-stringify";
import { DATAMODEL_VERSION } from "#dataModelVersion.js";
import { db, TransactionType } from "#db/index.js";
import {
    Asset,
    Catalog,
    CatalogMeasure,
    CatalogThreat,
    ComponentType,
    CreateAsset,
    CreateCatalog,
    CreateCatalogMeasure,
    CreateCatalogThreat,
    CreateProject,
    CreateThreat,
    Measure,
    MeasureImpact,
    Project,
    Threat,
} from "#db/schema.js";
import { Component, Connection, ConnectionPoint, PointOfAttack } from "#types/system.types.js";
import { createProject } from "#services/projects.service.js";
import { importAssets } from "#services/assets.service.js";
import { createCustomCatalog, getCatalogsByUserId } from "#services/catalogs.service.js";
import { getCatalogThreatsByCatalogId } from "#services/catalog-threats.service.js";
import { getCatalogMeasuresByCatalogId } from "#services/catalog-measures.service.js";
import { createComponentType } from "#services/component-types.service.js";
import { createMeasure } from "#services/measures.service.js";
import { createMeasureImpact } from "#services/measureImpacts.service.js";
import { createEmptySystem, updateSystem } from "#services/system.service.js";
import { createThreat } from "#services/threats.service.js";
import { BadRequestError } from "#errors/bad-request.error.js";
import { Logger } from "#logging/index.js";

/**
 * Imports the specified project and all associated data.
 *
 * @param {object} request - The http request.
 * @param {object} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function importProject(request: Request<void>, response: Response, next: NextFunction): Promise<void> {
    Logger.debug("call import project");

    const threatIdsDict = new Map<number, number>();
    const measureIdsDict = new Map<number, number>();
    const assetsIdsDict = new Map<number, number>();
    const catalogThreatsDict = new Map<number, number>();
    const catalogMeasuresDict = new Map<number, number>();

    try {
        await db.transaction(async (tx) => {
            const { body, user } = request;
            const oldProject = body.project as Project;

            if (body.datamodelVersion !== DATAMODEL_VERSION) {
                next(new BadRequestError("Invalid data model version"));
                return;
            }

            const usedCatalog = {
                catalog: body.catalog as Catalog,
                catalogThreats: JSON.parse(stringify(body.catalogThreats) ?? "") as CatalogThreat[],
                catalogMeasures: JSON.parse(stringify(body.catalogMeasures) ?? "") as CatalogMeasure[],
                user: user!,
            };

            const existingCatalog = await checkCatalogAlreadyExists(
                usedCatalog.catalog,
                usedCatalog.catalogThreats,
                usedCatalog.catalogMeasures,
                usedCatalog.user.id!
            );
            let newCatalogId: number;

            if (existingCatalog == -1) {
                const generatedCatalogId = await generateNewCatalog(
                    usedCatalog.catalog,
                    usedCatalog.catalogThreats,
                    usedCatalog.catalogMeasures,
                    usedCatalog.user.id!,
                    tx
                );
                newCatalogId = generatedCatalogId.id;
                body.project.catalogId = newCatalogId;
            } else {
                newCatalogId = existingCatalog;
            }

            const newCatalogThreats = await getCatalogThreatsByCatalogId(newCatalogId, tx);
            const newCatalogMeasures = await getCatalogMeasuresByCatalogId(newCatalogId, tx);

            usedCatalog.catalogThreats.forEach((oldCatalogThreat) => {
                catalogThreatsDict.set(
                    oldCatalogThreat.id,
                    newCatalogThreats.find(
                        (catalogThreat) =>
                            oldCatalogThreat.name === catalogThreat.name &&
                            oldCatalogThreat.description === catalogThreat.description &&
                            oldCatalogThreat.pointOfAttack === catalogThreat.pointOfAttack &&
                            oldCatalogThreat.attacker === catalogThreat.attacker &&
                            oldCatalogThreat.probability === catalogThreat.probability &&
                            oldCatalogThreat.confidentiality === catalogThreat.confidentiality &&
                            oldCatalogThreat.integrity === catalogThreat.integrity &&
                            oldCatalogThreat.availability === catalogThreat.availability
                    )!.id
                );
            });

            usedCatalog.catalogMeasures.forEach((oldCatalogMeasure) => {
                catalogMeasuresDict.set(
                    oldCatalogMeasure.id,
                    newCatalogMeasures.find(
                        (catalogMeasure) =>
                            oldCatalogMeasure.name === catalogMeasure.name &&
                            oldCatalogMeasure.description === catalogMeasure.description &&
                            oldCatalogMeasure.pointOfAttack === catalogMeasure.pointOfAttack &&
                            oldCatalogMeasure.attacker === catalogMeasure.attacker &&
                            oldCatalogMeasure.probability === catalogMeasure.probability &&
                            oldCatalogMeasure.confidentiality === catalogMeasure.confidentiality &&
                            oldCatalogMeasure.integrity === catalogMeasure.integrity &&
                            oldCatalogMeasure.availability === catalogMeasure.availability
                    )!.id
                );
            });

            const projectBody: CreateProject = {
                name: oldProject.name,
                description: oldProject.description,
                catalogId: newCatalogId,
            };
            const newProject = await createProject(user!.id!, projectBody, tx);
            const newProjectId = newProject.id;

            const oldAssets: Asset[] = JSON.parse(stringify(body.assets) ?? "");
            const oldAssetsCopy: CreateAsset[] = oldAssets.map((asset) => {
                return {
                    ...asset,
                    id: undefined,
                    projectId: newProjectId,
                    confidentialityJustification: asset.confidentialityJustification ?? "",
                    integrityJustification: asset.integrityJustification ?? "",
                    availabilityJustification: asset.availabilityJustification ?? "",
                };
            });
            const newAssets = oldAssetsCopy.length > 0 ? await importAssets(oldAssetsCopy, tx) : [];

            for (let i = 0; i < newAssets.length; i++) {
                assetsIdsDict.set(oldAssets[i]!.id, newAssets[i]!.id);
            }

            //Match new assets into System Json
            for (const pointOfAttack of body.system.data.pointsOfAttack as PointOfAttack[]) {
                // Iterate over each asset id in the current point of attack entry
                for (let j = 0; j < pointOfAttack.assets.length; j++) {
                    // Find the corresponding new asset id for the old asset id
                    const oldAssetId = pointOfAttack.assets[j]!;
                    // Update the asset id in the point of attack entry
                    pointOfAttack.assets[j] = assetsIdsDict.get(oldAssetId)!;
                }
                pointOfAttack.projectId = newProjectId;
            }

            body.system.projectId = newProjectId;
            delete body.system.id;

            for (const component of body.system.data.components as Component[]) {
                component.projectId = newProjectId;
            }
            for (const connection of body.system.data.connections as Connection[]) {
                connection.projectId = newProjectId;
                for (const metadata of connection.connectionPointsMeta) {
                    //can be undefined
                    if (metadata?.pointOfAttack) {
                        metadata.pointOfAttack.projectId = newProjectId;
                    }
                }
            }
            for (const connectionPoint of body.system.data.connectionPoints as ConnectionPoint[]) {
                connectionPoint.projectId = newProjectId;
            }

            await createEmptySystem(newProjectId, tx);
            await updateSystem(newProjectId, body.system, tx);
            Logger.debug("log saveSystem");

            for (const oldThreat of body.threats as Threat[]) {
                oldThreat.projectId = newProjectId;
                oldThreat.catalogThreatId = catalogThreatsDict.get(oldThreat.catalogThreatId)!;

                const oldThreatId = oldThreat.id;
                const trimmedThreat = removeAttributesFromObject(oldThreat, [
                    "id",
                    "createdAt",
                    "updatedAt",
                    "assets",
                ]) as CreateThreat;

                trimmedThreat.projectId = newProjectId;
                if (trimmedThreat.doneEditing === undefined || trimmedThreat.doneEditing === null) {
                    trimmedThreat.doneEditing = false;
                }
                const createdThreat = await createThreat(trimmedThreat, tx);
                threatIdsDict.set(oldThreatId, createdThreat!.id);
            }
            Logger.debug("createdThreats");

            for (const oldMeasure of body.measures as Measure[]) {
                if (oldMeasure.catalogMeasureId != null) {
                    oldMeasure.catalogMeasureId = catalogMeasuresDict.get(oldMeasure.catalogMeasureId) ?? null;
                }

                oldMeasure.projectId = newProjectId;

                const { id: oldMeasureId, ...insertMeasure } = oldMeasure;
                const newMeasure = await createMeasure(insertMeasure, tx);

                measureIdsDict.set(oldMeasureId, newMeasure!.id);
            }

            for (const oldMeasureImpact of body.measureImpacts as MeasureImpact[]) {
                oldMeasureImpact.threatId = threatIdsDict.get(oldMeasureImpact.threatId)!;
                oldMeasureImpact.measureId = measureIdsDict.get(oldMeasureImpact.measureId)!;

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { id: _id, ...insertMeasureImpact } = oldMeasureImpact;

                await createMeasureImpact(insertMeasureImpact, tx);
            }

            for (const componentType of body.componentTypes as ComponentType[]) {
                componentType.projectId = newProjectId;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { id: _id, ...insertComponentType } = componentType;
                await createComponentType(insertComponentType, tx);
            }
        });

        Logger.debug("imported");

        response.status(204).end();
    } catch (error) {
        const logId = Logger.error(
            `Error while importing project ${(error as Error).message ? (error as Error).message : ""}\ncause: ${(error as Error).cause}`
        );
        next(new BadRequestError(`Error while importing project.${logId !== null ? ` (Error ID: ${logId})` : ""}`));
    }
}

/**
 * Generates a new catalog including catalogThreats and catalogMeasures for a user
 *
 * @param {object} usedCatalog - A object containing a catalog, catalogThreats, catalogMeasures and a user
 */
async function generateNewCatalog(
    catalog: Catalog,
    catalogThreats: CatalogThreat[],
    catalogMeasures: CatalogMeasure[],
    userId: number,
    transaction: TransactionType
): Promise<Catalog> {
    const trimmedCatalog = removeAttributesFromObject(catalog, ["id", "createdAt", "updatedAt"]) as CreateCatalog;

    const trimmedThreats: CreateCatalogThreat[] = [];
    for (const catalogThreat of catalogThreats) {
        const trimmedThreat = removeAttributesFromObject({ ...catalogThreat }, [
            "id",
            "createdAt",
            "updatedAt",
            "catalogId",
        ]) as CreateCatalogThreat;
        trimmedThreats.push(trimmedThreat);
    }

    const trimmedMeasures: CreateCatalogMeasure[] = [];
    for (const catalogMeasure of catalogMeasures) {
        const trimmedMeasure = removeAttributesFromObject({ ...catalogMeasure }, [
            "id",
            "createdAt",
            "updatedAt",
            "catalogId",
        ]) as CreateCatalogMeasure;
        trimmedMeasures.push(trimmedMeasure);
    }

    return await createCustomCatalog(trimmedCatalog, trimmedThreats, trimmedMeasures, userId, transaction);
}

/**
 * Checks, if a set of catalog, catalogThreats, catalogMeasures exist for a user
 *
 * @param {object} usedCatalog - A object containing a catalog, catalogThreats, catalogMeasures and a user
 * @returns {number} returns the id of the matching catalog or -1 if no matching catalog was found
 */
async function checkCatalogAlreadyExists(
    catalog: Catalog,
    catalogThreats: CatalogThreat[],
    catalogMeasures: CatalogMeasure[],
    userId: number
): Promise<number> {
    const existingCatalogs = await getCatalogsByUserId(userId);
    for (const existingCatalog of existingCatalogs) {
        //There is a catalog with the same name and language
        if (existingCatalog.name === catalog.name && existingCatalog.language === catalog.language) {
            const existingThreats = await getCatalogThreatsByCatalogId(existingCatalog.id);
            const existingMeasures = await getCatalogMeasuresByCatalogId(existingCatalog.id);

            //There are the same number of measures and threats for it
            if (
                existingThreats.length === catalogThreats.length &&
                existingMeasures.length === catalogMeasures.length
            ) {
                //All threats are the same
                for (let u = 0; u < existingThreats.length; u++) {
                    const trimmedExistingThreat = removeAttributesFromObject(existingThreats[u], [
                        "id",
                        "createdAt",
                        "updatedAt",
                        "catalogId",
                    ]);

                    const trimmedNewThreat = removeAttributesFromObject({ ...catalogThreats[u] }, [
                        "id",
                        "createdAt",
                        "updatedAt",
                        "catalogId",
                    ]);

                    if (stringify(trimmedExistingThreat) !== stringify(trimmedNewThreat)) {
                        return -1;
                    }
                }

                //All measures are the same
                for (let k = 0; k < existingMeasures.length; k++) {
                    const trimmedExistingMeasure = removeAttributesFromObject(existingMeasures[k], [
                        "id",
                        "createdAt",
                        "updatedAt",
                        "catalogId",
                    ]);

                    const trimmedNewMeasure = removeAttributesFromObject({ ...catalogMeasures[k] }, [
                        "id",
                        "createdAt",
                        "updatedAt",
                        "catalogId",
                    ]);

                    if (stringify(trimmedExistingMeasure) !== stringify(trimmedNewMeasure)) {
                        return -1;
                    }
                }
                return existingCatalog.id;
            }
        }
    }
    return -1;
}

/**
 * Removes the specified attributes from a JavaScript object.
 * @param {object} obj - The object to modify.
 * @param {string[]} attrs - An array of strings containing the names of the attributes to remove.
 * @returns {object} The modified object with the specified attributes removed. If any of the specified attributes are missing from the object, the function returns the original object unchanged.
 */
function removeAttributesFromObject<Type>(obj: Type, attributesToRemove: string[]): Partial<Type> {
    for (const attributeName of attributesToRemove) {
        const attributeKey = attributeName as keyof Type;
        delete obj[attributeKey];
    }
    return obj;
}
