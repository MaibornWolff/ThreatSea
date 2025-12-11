import { LinearProgress } from "@mui/material";
import type { ComponentType } from "react";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import type { ExtendedProject } from "#api/types/project.types.ts";
import { ProjectsActions } from "../../application/actions/projects.actions";
import { projectsSelectors } from "../../application/selectors/projects.selectors";
import { useAppDispatch, useAppSelector } from "#application/hooks/use-app-redux.hook.ts";

interface InjectedProjectProp {
    project: ExtendedProject;
}

export const withProject = <P extends object>(Component: ComponentType<P & InjectedProjectProp>) => {
    const Inner = (props: P) => {
        const { projectId } = useParams<{ projectId?: string }>();

        const dispatch = useAppDispatch();

        const project = useAppSelector((state) => projectsSelectors.selectById(state, Number(projectId)));

        useEffect(() => {
            dispatch(ProjectsActions.getProjects());
        }, [dispatch]);

        return project ? <Component project={project} {...props} /> : <LinearProgress />;
    };

    return Inner;
};
