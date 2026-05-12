import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, type RefObject } from "react";
import type { Stage as KonvaStage } from "konva/lib/Stage";
import { TextEditingOverlay } from "./text-editing-overlay.component";
import { createAnnotation } from "../../../test-utils/builders";

const buildStageRef = (left = 100, top = 50): RefObject<KonvaStage | null> => {
    const stage = {
        container: () => ({
            getBoundingClientRect: () => ({ left, top, right: 0, bottom: 0, width: 0, height: 0, x: left, y: top }),
        }),
    } as unknown as KonvaStage;
    const ref = createRef<KonvaStage>();
    Object.defineProperty(ref, "current", { value: stage, writable: true });
    return ref;
};

const defaultProps = () => ({
    annotation: createAnnotation(),
    stageRef: buildStageRef(),
    layerPosition: { x: 0, y: 0 },
    stageScale: 1,
    stagePosition: { x: 0, y: 0 },
    onCommit: vi.fn(),
    onCancel: vi.fn(),
});

describe("TextEditingOverlay", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    describe("render", () => {
        it("renders nothing when stageRef.current is null", () => {
            const props = defaultProps();
            const nullRef = createRef<KonvaStage | null>() as RefObject<KonvaStage | null>;
            render(<TextEditingOverlay {...props} stageRef={nullRef} />);

            expect(screen.queryByLabelText("Edit annotation text")).not.toBeInTheDocument();
        });

        it("portals the textarea into document.body", () => {
            const { container } = render(<TextEditingOverlay {...defaultProps()} />);

            // Portal target is <body>; the component's own container should be empty.
            expect(container.firstChild).toBeNull();
            expect(screen.getByLabelText("Edit annotation text")).toBeInTheDocument();
        });

        it("seeds the textarea with the annotation's existing text", () => {
            const props = defaultProps();
            const { rerender: _rerender } = render(
                <TextEditingOverlay {...props} annotation={createAnnotation({ text: "hello world" })} />
            );

            const textarea = screen.getByLabelText("Edit annotation text") as HTMLTextAreaElement;
            expect(textarea.value).toBe("hello world");
        });

        it("style reflects bold / italic / underline / stroke / fontSize from the annotation", () => {
            const annotation = createAnnotation({
                bold: true,
                italic: true,
                underline: true,
                stroke: "#abcdef",
                fontSize: 24,
            });
            render(<TextEditingOverlay {...defaultProps()} annotation={annotation} />);

            const textarea = screen.getByLabelText("Edit annotation text") as HTMLTextAreaElement;
            expect(textarea.style.fontWeight).toBe("bold");
            expect(textarea.style.fontStyle).toBe("italic");
            expect(textarea.style.textDecoration).toBe("underline");
            expect(textarea.style.color).toBe("rgb(171, 205, 239)");
            expect(textarea.style.fontSize).toBe("24px");
        });

        it("style falls back to normal / none when bold, italic and underline are unset", () => {
            const annotation = createAnnotation({ bold: false, italic: false, underline: false });
            render(<TextEditingOverlay {...defaultProps()} annotation={annotation} />);

            const textarea = screen.getByLabelText("Edit annotation text") as HTMLTextAreaElement;
            expect(textarea.style.fontWeight).toBe("normal");
            expect(textarea.style.fontStyle).toBe("normal");
            expect(textarea.style.textDecoration).toBe("none");
        });

        it("positions the textarea using container rect + layer/stage offsets × stageScale", () => {
            const annotation = createAnnotation({ x: 10, y: 20, width: 100, height: 50 });
            render(
                <TextEditingOverlay
                    {...defaultProps()}
                    annotation={annotation}
                    layerPosition={{ x: 5, y: 7 }}
                    stagePosition={{ x: 3, y: 4 }}
                    stageScale={2}
                />
            );

            const textarea = screen.getByLabelText("Edit annotation text") as HTMLTextAreaElement;
            // screenX = containerRect.left(100) + stagePosition.x(3) + (layerPosition.x(5) + annotation.x(10)) * 2
            //        = 100 + 3 + 30 = 133
            expect(textarea.style.left).toBe("133px");
            // screenY = containerRect.top(50) + stagePosition.y(4) + (layerPosition.y(7) + annotation.y(20)) * 2
            //        = 50 + 4 + 54 = 108
            expect(textarea.style.top).toBe("108px");
            expect(textarea.style.width).toBe("200px");
            expect(textarea.style.height).toBe("100px");
        });
    });

    describe("Escape", () => {
        it("calls onCancel and does not commit", () => {
            const onCommit = vi.fn();
            const onCancel = vi.fn();
            render(<TextEditingOverlay {...defaultProps()} onCommit={onCommit} onCancel={onCancel} />);

            const textarea = screen.getByLabelText("Edit annotation text") as HTMLTextAreaElement;
            fireEvent.keyDown(textarea, { key: "Escape" });

            expect(onCancel).toHaveBeenCalledTimes(1);
            expect(onCommit).not.toHaveBeenCalled();
        });
    });

    describe("blur", () => {
        it("commits with the current value when focus moves to an unprotected target", async () => {
            const user = userEvent.setup();
            const onCommit = vi.fn();
            render(
                <div>
                    <TextEditingOverlay {...defaultProps()} onCommit={onCommit} />
                    <button>elsewhere</button>
                </div>
            );

            const textarea = screen.getByLabelText("Edit annotation text") as HTMLTextAreaElement;
            await user.click(textarea);
            await user.keyboard("typed");

            fireEvent.blur(textarea, { relatedTarget: screen.getByRole("button", { name: "elsewhere" }) });

            expect(onCommit).toHaveBeenCalledWith("typed");
        });

        it("does NOT commit when focus moves to a [data-edit-protected] target", () => {
            const onCommit = vi.fn();
            render(
                <div>
                    <TextEditingOverlay {...defaultProps()} onCommit={onCommit} />
                    <button data-edit-protected>sidebar control</button>
                </div>
            );

            const textarea = screen.getByLabelText("Edit annotation text") as HTMLTextAreaElement;
            fireEvent.blur(textarea, {
                relatedTarget: screen.getByRole("button", { name: "sidebar control" }),
            });

            expect(onCommit).not.toHaveBeenCalled();
        });

        it("does NOT commit when focus moves into a portaled MUI Popover", () => {
            const onCommit = vi.fn();
            render(
                <div>
                    <TextEditingOverlay {...defaultProps()} onCommit={onCommit} />
                    <div className="MuiPopover-root">
                        <button>menu item</button>
                    </div>
                </div>
            );

            const textarea = screen.getByLabelText("Edit annotation text") as HTMLTextAreaElement;
            fireEvent.blur(textarea, {
                relatedTarget: screen.getByRole("button", { name: "menu item" }),
            });

            expect(onCommit).not.toHaveBeenCalled();
        });
    });

    describe("outside click", () => {
        it("commits the textarea's current value when the user clicks an unprotected element", async () => {
            vi.useFakeTimers();
            const onCommit = vi.fn();
            render(
                <div>
                    <TextEditingOverlay
                        {...defaultProps()}
                        annotation={createAnnotation({ text: "typed" })}
                        onCommit={onCommit}
                    />
                    <button>elsewhere</button>
                </div>
            );

            // Overlay defers listener attachment by one tick.
            await vi.advanceTimersByTimeAsync(1);

            fireEvent.mouseDown(screen.getByRole("button", { name: "elsewhere" }));

            expect(onCommit).toHaveBeenCalledWith("typed");
        });

        it("does NOT commit when the click lands inside a [data-edit-protected] subtree", async () => {
            vi.useFakeTimers();
            const onCommit = vi.fn();
            render(
                <div>
                    <TextEditingOverlay {...defaultProps()} onCommit={onCommit} />
                    <div data-edit-protected>
                        <button>sidebar control</button>
                    </div>
                </div>
            );
            await vi.advanceTimersByTimeAsync(1);

            fireEvent.mouseDown(screen.getByRole("button", { name: "sidebar control" }));

            expect(onCommit).not.toHaveBeenCalled();
        });
    });

    describe("session is one-shot", () => {
        it("ignores a second blur/outside-click after the first commit", async () => {
            vi.useFakeTimers();
            const onCommit = vi.fn();
            render(
                <div>
                    <TextEditingOverlay {...defaultProps()} onCommit={onCommit} />
                    <button>elsewhere</button>
                </div>
            );
            await vi.advanceTimersByTimeAsync(1);

            const elsewhere = screen.getByRole("button", { name: "elsewhere" });
            const textarea = screen.getByLabelText("Edit annotation text") as HTMLTextAreaElement;

            // First commit: blur to an unprotected target.
            fireEvent.blur(textarea, { relatedTarget: elsewhere });
            expect(onCommit).toHaveBeenCalledTimes(1);

            // Second event in the same session: outside-click should be a no-op.
            fireEvent.mouseDown(elsewhere);
            expect(onCommit).toHaveBeenCalledTimes(1);
        });
    });
});
