import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditorSidebarSelectedAnnotation } from "./editor-sidebar-selected-annotation.component";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { createAnnotation } from "#test-utils/builders.ts";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { DEFAULT_ANNOTATION_COLOR } from "#api/types/system.types.ts";

describe("EditorSidebarSelectedAnnotation", () => {
    it("renders the sidebar title with the shape type and the stroke label", () => {
        renderWithProviders(
            <EditorSidebarSelectedAnnotation
                selectedAnnotation={createAnnotation()}
                userRole={USER_ROLES.EDITOR}
                onColorChange={vi.fn()}
                onChange={vi.fn()}
                onDelete={vi.fn()}
            />
        );

        expect(screen.getByText("Annotation: Rectangle")).toBeInTheDocument();
        expect(screen.getByText("Color")).toBeInTheDocument();
    });

    it.each([
        ["rect", "Annotation: Rectangle"],
        ["circle", "Annotation: Circle"],
        ["line", "Annotation: Line"],
        ["arrow", "Annotation: Arrow"],
        ["freehand", "Annotation: Pencil"],
        ["text", "Annotation: Text"],
    ] as const)("renders %s annotations as '%s' in the header", (type, expected) => {
        renderWithProviders(
            <EditorSidebarSelectedAnnotation
                selectedAnnotation={createAnnotation({ type })}
                userRole={USER_ROLES.EDITOR}
                onColorChange={vi.fn()}
                onChange={vi.fn()}
                onDelete={vi.fn()}
            />
        );

        expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it("renders a delete button for editors that calls onDelete when clicked", async () => {
        const user = userEvent.setup();
        const onDelete = vi.fn();
        renderWithProviders(
            <EditorSidebarSelectedAnnotation
                selectedAnnotation={createAnnotation()}
                userRole={USER_ROLES.EDITOR}
                onColorChange={vi.fn()}
                onChange={vi.fn()}
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
                onChange={vi.fn()}
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
                onChange={vi.fn()}
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
                onChange={vi.fn()}
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
                onChange={vi.fn()}
                onDelete={vi.fn()}
            />
        );

        const colorInput = container.querySelector('input[type="color"]') as HTMLInputElement;
        expect(colorInput.value).toBe("#abcdef");
    });

    describe("text-only formatting controls", () => {
        it("does not render formatting controls for non-text annotations", () => {
            renderWithProviders(
                <EditorSidebarSelectedAnnotation
                    selectedAnnotation={createAnnotation({ type: "rect" })}
                    userRole={USER_ROLES.EDITOR}
                    onColorChange={vi.fn()}
                    onChange={vi.fn()}
                    onDelete={vi.fn()}
                />
            );

            expect(screen.queryByRole("button", { name: "Bold" })).not.toBeInTheDocument();
            expect(screen.queryByRole("button", { name: "Italic" })).not.toBeInTheDocument();
            expect(screen.queryByRole("button", { name: "Underline" })).not.toBeInTheDocument();
            expect(screen.queryByLabelText("Font size")).not.toBeInTheDocument();
        });

        it("renders bold/italic/underline/font-size controls when the annotation is text", () => {
            renderWithProviders(
                <EditorSidebarSelectedAnnotation
                    selectedAnnotation={createAnnotation({ type: "text", text: "" })}
                    userRole={USER_ROLES.EDITOR}
                    onColorChange={vi.fn()}
                    onChange={vi.fn()}
                    onDelete={vi.fn()}
                />
            );

            expect(screen.getByRole("button", { name: "Bold" })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: "Italic" })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: "Underline" })).toBeInTheDocument();
            expect(screen.getByLabelText("Font size")).toBeInTheDocument();
        });

        it("dispatches the inverse bold flag when Bold is clicked", async () => {
            const user = userEvent.setup();
            const onChange = vi.fn();
            renderWithProviders(
                <EditorSidebarSelectedAnnotation
                    selectedAnnotation={createAnnotation({ type: "text", bold: false })}
                    userRole={USER_ROLES.EDITOR}
                    onColorChange={vi.fn()}
                    onChange={onChange}
                    onDelete={vi.fn()}
                />
            );

            await user.click(screen.getByRole("button", { name: "Bold" }));

            expect(onChange).toHaveBeenCalledWith({ bold: true });
        });

        it("dispatches the inverse italic flag when Italic is clicked", async () => {
            const user = userEvent.setup();
            const onChange = vi.fn();
            renderWithProviders(
                <EditorSidebarSelectedAnnotation
                    selectedAnnotation={createAnnotation({ type: "text", italic: true })}
                    userRole={USER_ROLES.EDITOR}
                    onColorChange={vi.fn()}
                    onChange={onChange}
                    onDelete={vi.fn()}
                />
            );

            await user.click(screen.getByRole("button", { name: "Italic" }));

            expect(onChange).toHaveBeenCalledWith({ italic: false });
        });

        it("dispatches the inverse underline flag when Underline is clicked", async () => {
            const user = userEvent.setup();
            const onChange = vi.fn();
            renderWithProviders(
                <EditorSidebarSelectedAnnotation
                    selectedAnnotation={createAnnotation({ type: "text", underline: false })}
                    userRole={USER_ROLES.EDITOR}
                    onColorChange={vi.fn()}
                    onChange={onChange}
                    onDelete={vi.fn()}
                />
            );

            await user.click(screen.getByRole("button", { name: "Underline" }));

            expect(onChange).toHaveBeenCalledWith({ underline: true });
        });

        it("renders a black color preset chip for text annotations", () => {
            renderWithProviders(
                <EditorSidebarSelectedAnnotation
                    selectedAnnotation={createAnnotation({ type: "text", stroke: "#abcdef" })}
                    userRole={USER_ROLES.EDITOR}
                    onColorChange={vi.fn()}
                    onChange={vi.fn()}
                    onDelete={vi.fn()}
                />
            );

            expect(screen.getByRole("button", { name: "#000000" })).toBeInTheDocument();
        });

        it("does not render a black color preset chip for non-text annotations", () => {
            renderWithProviders(
                <EditorSidebarSelectedAnnotation
                    selectedAnnotation={createAnnotation({ type: "rect" })}
                    userRole={USER_ROLES.EDITOR}
                    onColorChange={vi.fn()}
                    onChange={vi.fn()}
                    onDelete={vi.fn()}
                />
            );

            expect(screen.queryByRole("button", { name: "#000000" })).not.toBeInTheDocument();
        });

        it("forwards the black preset click to onColorChange", async () => {
            const user = userEvent.setup();
            const onColorChange = vi.fn();
            renderWithProviders(
                <EditorSidebarSelectedAnnotation
                    selectedAnnotation={createAnnotation({ type: "text", stroke: "#abcdef" })}
                    userRole={USER_ROLES.EDITOR}
                    onColorChange={onColorChange}
                    onChange={vi.fn()}
                    onDelete={vi.fn()}
                />
            );

            await user.click(screen.getByRole("button", { name: "#000000" }));

            expect(onColorChange).toHaveBeenCalledWith("#000000");
        });

        it("reflects the bold/italic/underline flags via aria-pressed", () => {
            renderWithProviders(
                <EditorSidebarSelectedAnnotation
                    selectedAnnotation={createAnnotation({
                        type: "text",
                        bold: true,
                        italic: false,
                        underline: true,
                    })}
                    userRole={USER_ROLES.EDITOR}
                    onColorChange={vi.fn()}
                    onChange={vi.fn()}
                    onDelete={vi.fn()}
                />
            );

            expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "true");
            expect(screen.getByRole("button", { name: "Italic" })).toHaveAttribute("aria-pressed", "false");
            expect(screen.getByRole("button", { name: "Underline" })).toHaveAttribute("aria-pressed", "true");
        });
    });
});
