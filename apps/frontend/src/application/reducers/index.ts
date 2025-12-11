import { combineReducers } from "@reduxjs/toolkit";
import projects from "./projects.reducer";
import { listReducer as list } from "./list.reducer";
import dialogs from "./dialogs.reducer";
import { assetsReducer as assets } from "./assets.reducer";
import { alertReducer as alert } from "./alert.reducer";
import catalogs from "./catalogs.reducer";
import system from "./system.reducer";
import editor from "./editor.reducer";
import catalogThreats from "./catalog-threats.reducer";
import catalogMeasures from "./catalog-measures.reducer";
import threats from "./threats.reducer";
import measures from "./measures.reducer";
import measureImpacts from "./measureImpacts.reducer";
import { confirmReducer as confirm } from "./confirm.reducer";
import { userReducer as user } from "./user.reducer";
import { errorReducer as error } from "./error.reducer";
import { navigationReducer as navigation } from "./navigation.reducer";
import { membersReducer as members } from "./members.reducer";

const reducers = {
    assets,
    projects,
    catalogs,
    list,
    dialogs,
    alert,
    system,
    editor,
    catalogThreats,
    catalogMeasures,
    threats,
    measures,
    measureImpacts,
    confirm,
    user,
    error,
    navigation,
    members,
};

export type ReducersMap = typeof reducers;
export const rootReducer = combineReducers(reducers);
