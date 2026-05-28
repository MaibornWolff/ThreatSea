import { act, fireEvent, render, screen } from "@testing-library/react";
import { useTextEdit } from "./use-text-edit.hook";

interface TestComponentProps {
    initialText: string;
    editing: boolean;
    onTextChange?: (text: string) => void;
    onExit?: () => void;
}

// textarea is uncontrolled (defaultValue), onChange pipes
// keystrokes to the hook. Matches the official Konva docs pattern.
const TestComponent = ({ initialText, editing, onTextChange = vi.fn(), onExit = vi.fn() }: TestComponentProps) => {
    const { ref, onChange, onBlur, onKeyDown } = useTextEdit({
        editing,
        onTextChange,
        onExit,
    });
    return (
        <textarea
            ref={ref}
            defaultValue={initialText}
            readOnly={!editing}
            onChange={onChange}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            data-testid="editable"
        />
    );
};

const flushAnimationFrame = (): Promise<void> =>
    act(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));

describe("useTextEdit", () => {
    it("calls onTextChange with the new value when the user types", () => {
        const onTextChange = vi.fn();
        render(<TestComponent initialText="hello" editing={true} onTextChange={onTextChange} />);

        const element = screen.getByTestId("editable") as HTMLTextAreaElement;
        fireEvent.change(element, { target: { value: "hello world" } });

        expect(onTextChange).toHaveBeenCalledWith("hello world");
    });

    it("focuses the textarea and places the caret at the end when editing flips on", async () => {
        const { rerender } = render(<TestComponent initialText="hello" editing={false} />);
        const element = screen.getByTestId("editable") as HTMLTextAreaElement;
        expect(document.activeElement).not.toBe(element);

        rerender(<TestComponent initialText="hello" editing={true} />);
        await flushAnimationFrame();

        expect(document.activeElement).toBe(element);
        expect(element.selectionStart).toBe("hello".length);
        expect(element.selectionEnd).toBe("hello".length);
    });

    it("does NOT focus when editing stays false", async () => {
        render(<TestComponent initialText="hello" editing={false} />);
        await flushAnimationFrame();
        const element = screen.getByTestId("editable");
        expect(document.activeElement).not.toBe(element);
    });

    it("fires onExit and preventDefault on Escape", () => {
        const onExit = vi.fn();
        render(<TestComponent initialText="hello" editing={true} onExit={onExit} />);

        const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
        const preventDefaultSpy = vi.spyOn(event, "preventDefault");
        fireEvent(screen.getByTestId("editable"), event);

        expect(onExit).toHaveBeenCalledTimes(1);
        expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it("stops Enter propagation without preventing default — preserves native newline", () => {
        const onExit = vi.fn();
        render(<TestComponent initialText="hello" editing={true} onExit={onExit} />);

        const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
        const preventDefaultSpy = vi.spyOn(event, "preventDefault");
        const stopPropagationSpy = vi.spyOn(event, "stopPropagation");
        fireEvent(screen.getByTestId("editable"), event);

        expect(onExit).not.toHaveBeenCalled();
        expect(preventDefaultSpy).not.toHaveBeenCalled();
        expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it("does NOT fire onExit on plain blur", () => {
        const onExit = vi.fn();
        render(<TestComponent initialText="hello" editing={true} onExit={onExit} />);

        fireEvent.blur(screen.getByTestId("editable"));

        expect(onExit).not.toHaveBeenCalled();
    });

    it("re-focuses when blur's relatedTarget is data-edit-protected", async () => {
        const TestWrap = () => (
            <>
                <TestComponent initialText="hello" editing={true} />
                <button type="button" data-edit-protected="">
                    protected
                </button>
            </>
        );
        render(<TestWrap />);
        // Let the initial edit-mode focus rAF fire before spying so we only
        // observe focus calls triggered by the blur handler.
        await flushAnimationFrame();

        const element = screen.getByTestId("editable");
        const focusSpy = vi.spyOn(element, "focus");
        fireEvent.blur(element, { relatedTarget: screen.getByText("protected") });
        await flushAnimationFrame();

        expect(focusSpy).toHaveBeenCalledTimes(1);
    });

    it("does NOT re-focus when blur's relatedTarget is unprotected", async () => {
        const TestWrap = () => (
            <>
                <TestComponent initialText="hello" editing={true} />
                <button type="button">unrelated</button>
            </>
        );
        render(<TestWrap />);
        await flushAnimationFrame();

        const element = screen.getByTestId("editable");
        const focusSpy = vi.spyOn(element, "focus");
        fireEvent.blur(element, { relatedTarget: screen.getByText("unrelated") });
        await flushAnimationFrame();

        expect(focusSpy).not.toHaveBeenCalled();
    });
});
