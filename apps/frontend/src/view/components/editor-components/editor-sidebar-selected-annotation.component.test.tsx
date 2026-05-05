import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditorSidebarSelectedAnnotation } from "./editor-sidebar-selected-annotation.component";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { createAnnotation } from "#test-utils/builders.ts";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { DEFAULT_ANNOTATION_COLOR } from "../../../application/hooks/use-annotation-drawing.hook";

describe("EditorSidebarSelectedAnnotation", () => {
    it("renders the sidebar title and stroke label", () => {
        renderWithProviders(
            <EditorSidebarSelectedAnnotation
                selectedAnnotation={createAnnotation()}
                userRole={USER_ROLES.EDITOR}
                onColorChange={vi.fn()}
                onDelete={vi.fn()}
            />
        );

        expect(screen.getByText("Annotation")).toBeInTheDocument();
        expect(screen.getByText("Color")).toBeInTheDocument();
    });

    it("renders a delete button for editors that calls onDelete when clicked", async () => {
        const user = userEvent.setup();
        const onDelete = vi.fn();
        renderWithProviders(
            <EditorSidebarSelectedAnnotation
                selectedAnnotation={createAnnotation()}
                userRole={USER_ROLES.EDITOR}
                onColorChange={vi.fn()}
                onDelete={onDelete}
            />
        );

        const deleteButton = screen.getByRole("button", { name: "Delete annotation" });
        await user.click(deleteButton);

        expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it("hides the delete button for viewers", () => {
        renderWithProviders(
            <EditorSidebarSelectedAnnotation
                selectedAnnotation={createAnnotation()}
                userRole={USER_ROLES.VIEWER}
                onColorChange={vi.fn()}
                onDelete={vi.fn()}
            />
        );

        expect(screen.queryByRole("button", { name: "Delete annotation" })).not.toBeInTheDocument();
    });

    it("forwards a preset click to onColorChange when the user is an editor", async () => {
        const user = userEvent.setup();
        const onColorChange = vi.fn();
        renderWithProviders(
            <EditorSidebarSelectedAnnotation
                selectedAnnotation={createAnnotation({ stroke: "#000000" })}
                userRole={USER_ROLES.EDITOR}
                onColorChange={onColorChange}
                onDelete={vi.fn()}
            />
        );

        await user.click(screen.getByRole("button", { name: DEFAULT_ANNOTATION_COLOR }));

        expect(onColorChange).toHaveBeenCalledWith(DEFAULT_ANNOTATION_COLOR);
    });

    it("renders the picker as disabled for viewers", () => {
        renderWithProviders(
            <EditorSidebarSelectedAnnotation
                selectedAnnotation={createAnnotation()}
                userRole={USER_ROLES.VIEWER}
                onColorChange={vi.fn()}
                onDelete={vi.fn()}
            />
        );

        expect(screen.getByRole("button", { name: DEFAULT_ANNOTATION_COLOR })).toBeDisabled();
    });

    it("seeds the color picker with the annotation's stroke", () => {
        const { container } = renderWithProviders(
            <EditorSidebarSelectedAnnotation
                selectedAnnotation={createAnnotation({ stroke: "#abcdef" })}
                userRole={USER_ROLES.EDITOR}
                onColorChange={vi.fn()}
                onDelete={vi.fn()}
            />
        );

        const colorInput = container.querySelector('input[type="color"]') as HTMLInputElement;
        expect(colorInput.value).toBe("#abcdef");
    });
});
