import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditorToolbar, type EditorToolbarProps } from "./editor-toolbar.component";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { DEFAULT_ANNOTATION_COLOR, type AnnotationType } from "#api/types/system.types.ts";

const setup = (overrides: Partial<EditorToolbarProps> = {}) => {
    const props = {
        onCenterEditor: vi.fn(),
        onDownloadSystemView: vi.fn(),
        showAnnotationTools: true,
        annotationTool: null as AnnotationType | null,
        onSetAnnotationTool: vi.fn(),
        annotationColor: DEFAULT_ANNOTATION_COLOR,
        onSetAnnotationColor: vi.fn(),
        ...overrides,
    };
    renderWithProviders(<EditorToolbar {...props} />);
    return props;
};

describe("EditorToolbar", () => {
    describe("always-visible buttons", () => {
        it("renders the center button and forwards clicks to onCenterEditor", async () => {
            const user = userEvent.setup();
            const onCenterEditor = vi.fn();
            setup({ onCenterEditor });

            await user.click(screen.getByRole("button", { name: "Center editor" }));

            expect(onCenterEditor).toHaveBeenCalledTimes(1);
        });

        it("renders the download button and forwards clicks to onDownloadSystemView", async () => {
            const user = userEvent.setup();
            const onDownloadSystemView = vi.fn();
            setup({ onDownloadSystemView });

            await user.click(screen.getByRole("button", { name: "Export System Image" }));

            expect(onDownloadSystemView).toHaveBeenCalledTimes(1);
        });
    });

    describe("annotation tools visibility", () => {
        it("hides the shapes button when showAnnotationTools is false", () => {
            setup({ showAnnotationTools: false });

            expect(screen.queryByRole("button", { name: "Shapes" })).not.toBeInTheDocument();
        });

        it("renders the shapes button when showAnnotationTools is true", () => {
            setup({ showAnnotationTools: true });

            expect(screen.getByRole("button", { name: "Shapes" })).toBeInTheDocument();
        });
    });

    describe("shapes popover", () => {
        it("opens the popover with rectangle, circle, line, and arrow tool buttons when shapes is clicked", async () => {
            const user = userEvent.setup();
            setup();

            await user.click(screen.getByRole("button", { name: "Shapes" }));

            for (const name of ["Rectangle", "Circle", "Line", "Arrow"]) {
                expect(screen.getByRole("button", { name })).toBeInTheDocument();
            }
        });

        it("calls onSetAnnotationTool with the selected tool when a tool button is clicked", async () => {
            const user = userEvent.setup();
            const onSetAnnotationTool = vi.fn();
            setup({ onSetAnnotationTool });

            await user.click(screen.getByRole("button", { name: "Shapes" }));
            await user.click(screen.getByRole("button", { name: "Rectangle" }));

            expect(onSetAnnotationTool).toHaveBeenCalledWith("rect");
        });

        it("calls onSetAnnotationTool with null when the active tool is clicked again (toggle off)", async () => {
            const user = userEvent.setup();
            const onSetAnnotationTool = vi.fn();
            setup({ annotationTool: "rect", onSetAnnotationTool });

            await user.click(screen.getByRole("button", { name: "Shapes" }));
            await user.click(screen.getByRole("button", { name: "Rectangle" }));

            expect(onSetAnnotationTool).toHaveBeenCalledWith(null);
        });

        it("marks the active tool with aria-pressed=true and inactive tools with aria-pressed=false", async () => {
            const user = userEvent.setup();
            setup({ annotationTool: "rect" });

            await user.click(screen.getByRole("button", { name: "Shapes" }));

            expect(screen.getByRole("button", { name: "Rectangle" })).toHaveAttribute("aria-pressed", "true");
            expect(screen.getByRole("button", { name: "Circle" })).toHaveAttribute("aria-pressed", "false");
        });

        it("marks the shapes button as pressed when an annotation tool is active", () => {
            setup({ annotationTool: "rect" });

            expect(screen.getByRole("button", { name: "Shapes" })).toHaveAttribute("aria-pressed", "true");
        });

        it("forwards a color preset click to onSetAnnotationColor", async () => {
            const user = userEvent.setup();
            const onSetAnnotationColor = vi.fn();
            setup({ annotationColor: "#000000", onSetAnnotationColor });

            await user.click(screen.getByRole("button", { name: "Shapes" }));
            await user.click(screen.getByRole("button", { name: DEFAULT_ANNOTATION_COLOR }));

            expect(onSetAnnotationColor).toHaveBeenCalledWith(DEFAULT_ANNOTATION_COLOR);
        });
    });
});
