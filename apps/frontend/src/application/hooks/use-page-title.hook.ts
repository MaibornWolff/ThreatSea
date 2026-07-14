import { useEffect } from "react";
import { useParams } from "react-router";
import { useAppSelector } from "./use-app-redux.hook";

const APP_NAME = "ThreatSea";

/**
 * Sets the browser tab title to "ThreatSea - {project/catalogue name} - {view}".
 * @param viewLabel Already-translated label for the current view (e.g. t("assets")).
 */
export const usePageTitle = (viewLabel?: string): void => {
    const { projectId, catalogId } = useParams<{ projectId?: string; catalogId?: string }>();

    const entityName = useAppSelector((state) => {
        if (projectId) {
            return state.projects.entities[Number(projectId)]?.name;
        }
        if (catalogId) {
            return state.catalogs.entities[Number(catalogId)]?.name;
        }
        return undefined;
    });

    const title = [APP_NAME, entityName, viewLabel].filter(Boolean).join(" - ");

    useEffect(() => {
        document.title = title;
        return () => {
            document.title = APP_NAME;
        };
    }, [title]);
};
