import { isRejected } from "@reduxjs/toolkit";
import type { AppMiddleware } from "./types";
import { AssetsActions } from "#application/actions/assets.actions.ts";
import { CatalogMeasuresActions } from "#application/actions/catalog-measures.actions.ts";
import { CatalogThreatsActions } from "#application/actions/catalog-threats.actions.ts";
import { CatalogsActions } from "#application/actions/catalogs.actions.ts";
import { ErrorActions } from "#application/actions/error.actions.ts";
import { MeasuresActions } from "#application/actions/measures.actions.ts";
import { MemberActions } from "#application/actions/members.actions.ts";
import { ProjectsActions } from "#application/actions/projects.actions.ts";
import { SystemActions } from "#application/actions/system.actions.ts";
import { roleHandlingHelper } from "#application/reducers/members.reducer.ts";
import { MeasureImpactsActions } from "#application/actions/measureImpacts.actions.ts";
import { UserActions } from "#application/actions/user.actions.ts";
import { EditorActions } from "#application/actions/editor.actions.ts";

const asyncThunks = [
    AssetsActions.getAssets,
    AssetsActions.createAsset,
    AssetsActions.updateAsset,
    AssetsActions.deleteAsset,
    CatalogMeasuresActions.getCatalogMeasures,
    CatalogMeasuresActions.createCatalogMeasure,
    CatalogMeasuresActions.importCatalogMeasures,
    CatalogMeasuresActions.updateCatalogMeasure,
    CatalogMeasuresActions.deleteCatalogMeasure,
    CatalogThreatsActions.getCatalogThreats,
    CatalogThreatsActions.createCatalogThreat,
    CatalogThreatsActions.importCatalogThreats,
    CatalogThreatsActions.updateCatalogThreat,
    CatalogThreatsActions.deleteCatalogThreat,
    CatalogsActions.getCatalogs,
    CatalogsActions.getCatalogFromBackend,
    CatalogsActions.createCatalog,
    CatalogsActions.updateCatalog,
    CatalogsActions.deleteCatalog,
    EditorActions.getComponentTypes,
    EditorActions.createComponentType,
    EditorActions.updateComponentType,
    EditorActions.deleteComponentType,
    MeasureImpactsActions.getMeasureImpacts,
    MeasureImpactsActions.createMeasureImpact,
    MeasureImpactsActions.updateMeasureImpact,
    MeasureImpactsActions.deleteMeasureImpact,
    MeasuresActions.getMeasures,
    MeasuresActions.createMeasure,
    MeasuresActions.updateMeasure,
    MeasuresActions.deleteMeasure,
    MemberActions.getAddedMembers,
    MemberActions.getAddableMembers,
    MemberActions.addAddableMember,
    MemberActions.updateAddedMember,
    MemberActions.deleteAddedMember,
    ProjectsActions.getProjects,
    ProjectsActions.getProjectFromBackend,
    ProjectsActions.createProject,
    ProjectsActions.deleteProject,
    ProjectsActions.updateProject,
    ProjectsActions.importProjectFromJson,
    ProjectsActions.exportProjectToJson,
    SystemActions.getSystem,
    SystemActions.updateSystem,
    // legacy threats actions removed
    UserActions.getAuthStatus,
    UserActions.logOut,
] as const;

const isRejectedAction = isRejected(...asyncThunks);

const handleErrors: AppMiddleware =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        next(action);

        if (isRejectedAction(action)) {
            dispatch(ErrorActions.setAPIError(action.error));

            //resets userRole to INVALID_ROLE (userRole is set by the FetchAPI call)
            if (roleHandlingHelper.userRole === undefined) {
                return;
            }

            if (roleHandlingHelper.isProject) {
                dispatch(ProjectsActions.changeOwnProjectRole(roleHandlingHelper.userRole));
            } else {
                dispatch(CatalogsActions.changeOwnCatalogRole(roleHandlingHelper.userRole));
            }
            roleHandlingHelper.userRole = undefined;
        }
    };

const errorMiddlewares: AppMiddleware[] = [handleErrors];

export default errorMiddlewares;
