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

const handleConfirmDialog =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        next(action);
        if (DialogsActions.confirmDialog.match(action)) {
            const {
                payload: { nameSpace, data },
            } = action;

            if (data.id) {
                switch (nameSpace) {
                    case "projects":
                        dispatch(ProjectsActions.updateProject(data));
                        break;
                    case "assets":
                        dispatch(AssetsActions.updateAsset(data));
                        dispatch(EditorActions.setAutoSaveStatus("saving"));
                        break;
                    case "catalogs":
                        dispatch(CatalogsActions.updateCatalog(data));
                        break;
                    case "catalogThreats":
                        dispatch(CatalogThreatsActions.updateCatalogThreat(data));
                        break;
                    case "catalogMeasures":
                        dispatch(CatalogMeasuresActions.updateCatalogMeasure(data));
                        break;
                    case "threats":
                        dispatch(ThreatsActions.updateThreat(data));
                        break;
                    case "measures":
                        dispatch(MeasuresActions.updateMeasure(data));
                        break;
                    case "components":
                        dispatch(EditorActions.updateComponentType(data));
                        break;
                    case "addedMember":
                        dispatch(MemberActions.updateAddedMember(data));
                        break;
                    case "addableMember":
                        dispatch(MemberActions.addAddableMember(data));
                        break;
                    case "measureImpacts":
                        dispatch(MeasureImpactsActions.updateMeasureImpact(data));
                        break;
                    default:
                        break;
                }
            } else {
                switch (nameSpace) {
                    case "projects":
                        dispatch(ProjectsActions.createProject(data));
                        break;
                    case "assets":
                        dispatch(AssetsActions.createAsset(data));
                        dispatch(EditorActions.setAutoSaveStatus("saving"));
                        break;
                    case "catalogs":
                        dispatch(CatalogsActions.createCatalog(data));
                        break;
                    case "catalogThreats":
                        dispatch(CatalogThreatsActions.createCatalogThreat(data));
                        break;
                    case "catalogMeasures":
                        dispatch(CatalogMeasuresActions.createCatalogMeasure(data));
                        break;
                    case "threats":
                        dispatch(ThreatsActions.createThreat(data));
                        break;
                    case "measures":
                        dispatch(MeasuresActions.createMeasure(data));
                        break;
                    case "components":
                        dispatch(EditorActions.createComponentType(data));
                        break;
                    case "measureImpacts":
                        dispatch(MeasureImpactsActions.createMeasureImpact(data));
                        break;
                    default:
                        break;
                }
            }
        }
    };

const dialogsMiddlewares = [handleConfirmDialog];

export default dialogsMiddlewares;
