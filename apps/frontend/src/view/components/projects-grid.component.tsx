import { Box, Grid } from "@mui/material";
import { ProjectCard } from "./project-card.component";
import type { ExtendedProject } from "../../api/types/project.types";

interface ProjectsGridComponentProps {
    projects: ExtendedProject[];
    columnCount: number;
    onClickDeleteProject: (event: React.MouseEvent<HTMLElement, MouseEvent>, project: ExtendedProject) => void;
    onClickEditProject: (event: React.MouseEvent<HTMLElement, MouseEvent>, project: ExtendedProject) => void;
}

export const ProjectsGridComponent = ({
    projects,
    columnCount,
    onClickDeleteProject,
    onClickEditProject,
}: ProjectsGridComponentProps) => {
    const columns = new Array(columnCount).fill(0);
    return (
        <Grid
            container
            spacing={2}
            sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                width: "100%",
                overflowY: "auto",
                boxSizing: "content-box",
                paddingRight: 2,
                marginTop: 0,
            }}
            data-testid="ProjectsPageProjectsGrid"
        >
            {columns.map((_, columnIndex) => {
                return (
                    <Grid
                        key={columnIndex}
                        item
                        xs={Math.floor(12 / columnCount)}
                        sx={{
                            paddingTop: "0 !important",
                            overflow: "visible",
                        }}
                    >
                        {projects.map((project, i) => {
                            const currentRow = Math.floor(i / columnCount);
                            const rowCount = Math.ceil(projects.length / columnCount);
                            if (i % columnCount !== columnIndex) {
                                return <Box key={i}></Box>;
                            }

                            return (
                                <ProjectCard
                                    key={i}
                                    project={project}
                                    onClickDeleteProject={onClickDeleteProject}
                                    onClickEditProject={onClickEditProject}
                                    sx={{
                                        marginBottom: currentRow < rowCount - 1 ? 2 : "2px",
                                    }}
                                />
                            );
                        })}
                    </Grid>
                );
            })}
        </Grid>
    );
};
