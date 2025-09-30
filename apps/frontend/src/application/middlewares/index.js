import assets from "./assets/assets.middleware";
import projects from "./projects/projects.middleware";
import alert from "./alert/alert.middleware";
import dialogs from "./dialogs/dialogs.middleware";
import catalogs from "./catalogs/catalogs.middleware";
import system from "./system/system.middleware";
import editor from "./editor/editor.middleware";
import threats from "./threats/threats.middleware";
import measures from "./measures/measures.middleware";
import measureImpacts from "./measureImpacts/measureImpacts.middleware";
import catalogThreats from "./catalogThreats/catalog-threats.middleware";
import catalogMeasures from "./catalogMeasures/catalog-threats.middleware";
import { errorMiddlewares as errors } from "./error.middleware";
import members from "./members.middleware";
import user from "./user/user.middleware";

export const middleware = [
    ...errors,
    ...assets,
    ...projects,
    ...alert,
    ...dialogs,
    ...system,
    ...editor,
    ...catalogs,
    ...threats,
    ...measures,
    ...measureImpacts,
    ...catalogThreats,
    ...catalogMeasures,
    ...members,
    ...user,
];
