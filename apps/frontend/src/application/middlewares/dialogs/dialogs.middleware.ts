import type { AppMiddleware } from "../types";
import { AssetsActions } from "../../actions/assets.actions";
import { ProjectsActions } from "../../actions/projects.actions";
import { DialogsActions } from "../../actions/dialogs.actions";
import { CatalogsActions } from "../../actions/catalogs.actions";
import { CatalogThreatsActions } from "../../actions/catalog-threats.actions";
import { ThreatsActions } from "../../actions/threats.actions";
import { CatalogMeasuresActions } from "../../actions/catalog-measures.actions";
import { MeasuresActions } from "../../actions/measures.actions";
import { MeasureImpactsActions } from "../../actions/measureImpacts.actions";
import { EditorActions } from "../../actions/editor.actions";
import { MemberActions } from "../../actions/members.actions";

const handleConfirmDialog: AppMiddleware =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        next(action);
        if (DialogsActions.confirmDialog.match(action)) {
            const { nameSpace, data } = action.payload;
            const hasIdentifier = (data as { id: string | number | undefined | null }).id != null;

            if (hasIdentifier) {
                switch (nameSpace) {
                    case "projects":
                        dispatch(
                            ProjectsActions.updateProject(data as Parameters<typeof ProjectsActions.updateProject>[0])
                        );
                        break;
                    case "assets":
                        dispatch(AssetsActions.updateAsset(data as Parameters<typeof AssetsActions.updateAsset>[0]));
                        dispatch(EditorActions.setAutoSaveStatus("saving"));
                        break;
                    case "catalogs":
                        dispatch(
                            CatalogsActions.updateCatalog(data as Parameters<typeof CatalogsActions.updateCatalog>[0])
                        );
                        break;
                    case "catalogThreats":
                        dispatch(
                            CatalogThreatsActions.updateCatalogThreat(
                                data as Parameters<typeof CatalogThreatsActions.updateCatalogThreat>[0]
                            )
                        );
                        break;
                    case "catalogMeasures":
                        dispatch(
                            CatalogMeasuresActions.updateCatalogMeasure(
                                data as Parameters<typeof CatalogMeasuresActions.updateCatalogMeasure>[0]
                            )
                        );
                        break;
                    case "threats":
                        dispatch(
                            ThreatsActions.updateThreat(data as Parameters<typeof ThreatsActions.updateThreat>[0])
                        );
                        break;
                    case "measures":
                        dispatch(
                            MeasuresActions.updateMeasure(data as Parameters<typeof MeasuresActions.updateMeasure>[0])
                        );
                        break;
                    case "components":
                        dispatch(
                            EditorActions.updateComponentType(
                                data as Parameters<typeof EditorActions.updateComponentType>[0]
                            )
                        );
                        break;
                    case "addedMember":
                        dispatch(
                            MemberActions.updateAddedMember(
                                data as Parameters<typeof MemberActions.updateAddedMember>[0]
                            )
                        );
                        break;
                    case "addableMember":
                        dispatch(
                            MemberActions.addAddableMember(data as Parameters<typeof MemberActions.addAddableMember>[0])
                        );
                        break;
                    case "measureImpacts":
                        dispatch(
                            MeasureImpactsActions.updateMeasureImpact(
                                data as Parameters<typeof MeasureImpactsActions.updateMeasureImpact>[0]
                            )
                        );
                        break;
                    default:
                        break;
                }
            } else {
                switch (nameSpace) {
                    case "projects":
                        dispatch(
                            ProjectsActions.createProject(data as Parameters<typeof ProjectsActions.createProject>[0])
                        );
                        break;
                    case "assets":
                        dispatch(AssetsActions.createAsset(data as Parameters<typeof AssetsActions.createAsset>[0]));
                        dispatch(EditorActions.setAutoSaveStatus("saving"));
                        break;
                    case "catalogs":
                        dispatch(
                            CatalogsActions.createCatalog(data as Parameters<typeof CatalogsActions.createCatalog>[0])
                        );
                        break;
                    case "catalogThreats":
                        dispatch(
                            CatalogThreatsActions.createCatalogThreat(
                                data as Parameters<typeof CatalogThreatsActions.createCatalogThreat>[0]
                            )
                        );
                        break;
                    case "catalogMeasures":
                        dispatch(
                            CatalogMeasuresActions.createCatalogMeasure(
                                data as Parameters<typeof CatalogMeasuresActions.createCatalogMeasure>[0]
                            )
                        );
                        break;
                    case "threats":
                        dispatch(
                            ThreatsActions.createThreat(data as Parameters<typeof ThreatsActions.createThreat>[0])
                        );
                        break;
                    case "measures":
                        dispatch(
                            MeasuresActions.createMeasure(data as Parameters<typeof MeasuresActions.createMeasure>[0])
                        );
                        break;
                    case "components":
                        dispatch(
                            EditorActions.createComponentType(
                                data as Parameters<typeof EditorActions.createComponentType>[0]
                            )
                        );
                        break;
                    case "measureImpacts":
                        dispatch(
                            MeasureImpactsActions.createMeasureImpact(
                                data as Parameters<typeof MeasureImpactsActions.createMeasureImpact>[0]
                            )
                        );
                        break;
                    default:
                        break;
                }
            }
        }
    };

const dialogsMiddlewares: AppMiddleware[] = [handleConfirmDialog];

export default dialogsMiddlewares;
