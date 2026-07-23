import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ExtendedProject } from "#api/types/project.types.ts";
import { createFolder, createProject } from "#test-utils/builders.ts";
import { mockUseConfirm, mockUseFolders } from "#test-utils/mock-hooks.ts";
import { buildFolderTree } from "#utils/build-folder-tree.ts";

const navigate = vi.fn();
vi.mock("react-router", () => ({ useNavigate: () => navigate }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

// The accordion owns grouping and sections, not card layout — stub the grid.
vi.mock("./projects-grid.component", () => ({
    ProjectsGridComponent: ({ projects }: { projects: ExtendedProject[] }) => (
        <div data-testid="grid">
            {projects.map((project) => (
                <span key={project.id}>proj-{project.id}</span>
            ))}
        </div>
    ),
}));

import { FoldersAccordion } from "./folders-accordion.component";

const handlers = {
    columnCount: 1,
    onClickEditProject: vi.fn(),
    onClickDeleteProject: vi.fn(),
};

describe("FoldersAccordion", () => {
    it("renders a section per root folder and an ungrouped section for folder-less projects", () => {
        const tree = buildFolderTree(
            [createFolder({ id: 1, name: "Payments" })],
            [createProject({ id: 10, folderId: 1 }), createProject({ id: 11, folderId: null })]
        );
        mockUseFolders();
        mockUseConfirm();

        render(<FoldersAccordion tree={tree} {...handlers} />);

        expect(screen.getByTestId("folder-section-1")).toBeInTheDocument();
        expect(screen.getByTestId("folder-section-ungrouped")).toBeInTheDocument();
    });

    it("omits the ungrouped section when every project is filed", () => {
        const tree = buildFolderTree([createFolder({ id: 1 })], [createProject({ id: 10, folderId: 1 })]);
        mockUseFolders();
        mockUseConfirm();

        render(<FoldersAccordion tree={tree} {...handlers} />);

        expect(screen.queryByTestId("folder-section-ungrouped")).not.toBeInTheDocument();
    });

    it("navigates to the rename route from a folder's menu", async () => {
        const folder = createFolder({ id: 1, name: "Payments" });
        const tree = buildFolderTree([folder], []);
        mockUseFolders();
        mockUseConfirm();

        render(<FoldersAccordion tree={tree} {...handlers} />);
        await userEvent.click(screen.getByTestId("folder-section-1_menu-button"));
        await userEvent.click(screen.getByTestId("folder-section-1_rename-button"));

        expect(navigate).toHaveBeenCalledWith("/projects/folders/1", { state: { folder } });
    });

    it("opens a confirm when deleting a folder", async () => {
        const tree = buildFolderTree(
            [createFolder({ id: 1, name: "Payments" })],
            [createProject({ id: 10, folderId: 1 })]
        );
        const openConfirm = vi.fn();
        mockUseFolders();
        mockUseConfirm({ openConfirm });

        render(<FoldersAccordion tree={tree} {...handlers} />);
        await userEvent.click(screen.getByTestId("folder-section-1_menu-button"));
        await userEvent.click(screen.getByTestId("folder-section-1_delete-button"));

        expect(openConfirm).toHaveBeenCalledTimes(1);
    });

    it("disables new-subfolder once a folder is at the maximum depth", async () => {
        // A straight chain 1→2→…→7, so folder 7 sits at depth 7 (the limit).
        const folders = Array.from({ length: 7 }, (_, index) =>
            createFolder({ id: index + 1, name: `L${index}`, parentId: index === 0 ? null : index })
        );
        const tree = buildFolderTree(folders, []);
        mockUseFolders();
        mockUseConfirm();

        render(<FoldersAccordion tree={tree} {...handlers} />);
        await userEvent.click(screen.getByTestId("folder-section-7_menu-button"));

        expect(screen.getByTestId("folder-section-7_new-subfolder-button")).toHaveAttribute("aria-disabled", "true");
    });
});
