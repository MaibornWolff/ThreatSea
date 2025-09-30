import { isRejected } from "@reduxjs/toolkit";
import { AssetsActions } from "../actions/assets.actions";
import { CatalogMeasuresActions } from "../actions/catalog-measures.actions";
import { CatalogThreatsActions } from "../actions/catalog-threats.actions";
import { CatalogsActions } from "../actions/catalogs.actions";
import { ErrorActions } from "../actions/error.actions";
import { MeasuresActions } from "../actions/measures.actions";
import { MemberActions } from "../actions/members.actions";
import { ProjectsActions } from "../actions/projects.actions";
import { SystemActions } from "../actions/system.actions";
import { ThreatsActions } from "../actions/threats.actions";
import { roleHandlingHelper } from "../reducers/members.reducer";
import { MeasureImpactsActions } from "../actions/measureImpacts.actions";
import { UserActions } from "../actions/user.actions";
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
    ThreatsActions.getThreats,
    ThreatsActions.createThreat,
    ThreatsActions.updateThreat,
    ThreatsActions.deleteThreat,
    UserActions.getAuthStatus,
    UserActions.logOut,
];

const isRejectedAction = isRejected(...asyncThunks);

const handleErrors =
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

const errorMiddlewares = [handleErrors];

export { errorMiddlewares };
