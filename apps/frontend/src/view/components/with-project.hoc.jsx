import { LinearProgress } from "@mui/material";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ProjectsActions } from "../../application/actions/projects.actions";
import { projectsSelectors } from "../../application/selectors/projects.selectors";
import { useParams } from "react-router-dom";

export const withProject = (Component) => {
    const Inner = (props) => {
        const { projectId } = useParams();

        const dispatch = useDispatch();

        const project = useSelector((state) => projectsSelectors.selectById(state, parseInt(projectId)));

        useEffect(() => {
            dispatch(ProjectsActions.getProjects());
        }, [dispatch]);

        return project ? <Component project={project} {...props} /> : <LinearProgress />;
    };

    return Inner;
};
