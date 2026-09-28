import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { createProject } from "#test-utils/builders.ts";
import { mockUseConfirm, mockUseFolders, mockUseProjects } from "#test-utils/mock-hooks.ts";

vi.mock("../components/create-page.component", () => ({
    CreatePage: (_Header: unknown, Body: unknown) => Body,
}));

import { ProjectsPage } from "./projects.page";

beforeEach(() => {
    mockUseProjects({ items: [createProject({ id: 1, name: "Online Shop", description: "" })] });
    mockUseFolders();
    mockUseConfirm();
});

describe("ProjectsPage — search", () => {
    it("shows a no-results message when the search matches no project", async () => {
        renderWithProviders(<ProjectsPage />);

        await userEvent.type(screen.getByRole("textbox"), "zzz");

        expect(screen.getByText('No projects match "zzz"')).toBeInTheDocument();
    });

    it("shows matching projects instead of the no-results message", async () => {
        renderWithProviders(<ProjectsPage />);

        await userEvent.type(screen.getByRole("textbox"), "shop");

        expect(screen.getByText("Online Shop")).toBeInTheDocument();
        expect(screen.queryByText(/No projects match/)).not.toBeInTheDocument();
    });
});

describe("ProjectsPage — sort toggles", () => {
    it("gives the icon-only sort direction buttons accessible names", () => {
        renderWithProviders(<ProjectsPage />);

        expect(screen.getByRole("button", { name: "Sort ascending" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Sort descending" })).toBeInTheDocument();
    });
});
