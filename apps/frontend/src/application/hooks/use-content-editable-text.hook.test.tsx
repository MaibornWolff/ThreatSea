import { act, fireEvent, render, screen } from "@testing-library/react";
import { useContentEditableText } from "./use-content-editable-text.hook";

interface TestComponentProps {
    text: string;
    editing: boolean;
    onTextChange?: (text: string) => void;
    onExit?: () => void;
}

const TestComponent = ({ text, editing, onTextChange = vi.fn(), onExit = vi.fn() }: TestComponentProps) => {
    const { setRef, onInput, onBlur, onKeyDown } = useContentEditableText({
        text,
        editing,
        onTextChange,
        onExit,
    });
    return (
        <div
            ref={setRef}
            contentEditable={editing}
            suppressContentEditableWarning
            onInput={onInput}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            data-testid="editable"
        />
    );
};

const flushAnimationFrame = (): Promise<void> =>
    act(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));

describe("useContentEditableText", () => {
    it("seeds the initial textContent when the ref attaches", () => {
        render(<TestComponent text="hello" editing={false} />);
        expect(screen.getByTestId("editable").textContent).toBe("hello");
    });

    it("syncs external text changes while not editing", () => {
        const { rerender } = render(<TestComponent text="hello" editing={false} />);
        rerender(<TestComponent text="world" editing={false} />);
        expect(screen.getByTestId("editable").textContent).toBe("world");
    });

    it("does NOT overwrite the contentEditable from external text while editing — preserves the user's caret", () => {
        const { rerender } = render(<TestComponent text="hello" editing={true} />);
        const element = screen.getByTestId("editable");
        element.textContent = "user typed this";

        rerender(<TestComponent text="external update arrived" editing={true} />);

        expect(element.textContent).toBe("user typed this");
    });

    it("focuses the element when editing flips on", async () => {
        const { rerender } = render(<TestComponent text="hello" editing={false} />);
        const element = screen.getByTestId("editable");
        expect(document.activeElement).not.toBe(element);

        rerender(<TestComponent text="hello" editing={true} />);
        await flushAnimationFrame();

        expect(document.activeElement).toBe(element);
    });

    it("dispatches the current text via onTextChange when the user types", () => {
        const onTextChange = vi.fn();
        render(<TestComponent text="hello" editing={true} onTextChange={onTextChange} />);

        const element = screen.getByTestId("editable");

        Object.defineProperty(element, "innerText", { value: "edited", configurable: true });
        fireEvent.input(element);

        expect(onTextChange).toHaveBeenCalledWith("edited");
    });

    it("fires onExit when Escape is pressed", () => {
        const onExit = vi.fn();
        render(<TestComponent text="hello" editing={true} onExit={onExit} />);

        fireEvent.keyDown(screen.getByTestId("editable"), { key: "Escape" });

        expect(onExit).toHaveBeenCalledTimes(1);
    });

    it("does NOT fire onExit on plain blur — blur is intentionally not an exit signal", () => {
        const onExit = vi.fn();
        render(<TestComponent text="hello" editing={true} onExit={onExit} />);

        fireEvent.blur(screen.getByTestId("editable"));

        expect(onExit).not.toHaveBeenCalled();
    });

    it("re-focuses when blur's relatedTarget is data-edit-protected", async () => {
        const TestWrap = () => (
            <>
                <TestComponent text="hello" editing={true} />
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
                <TestComponent text="hello" editing={true} />
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
