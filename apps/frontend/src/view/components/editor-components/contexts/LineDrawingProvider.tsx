import { useEffect, useState, type ReactNode } from "react";
import { LineDrawingContext, type LineDrawingState } from "./LineDrawingContext";
import { useAppSelector } from "#application/hooks/use-app-redux.hook.ts";
import { editorSelectors } from "#application/selectors/editor.selectors.ts";

interface LineDrawingProviderProps {
    children: ReactNode;
}

export function LineDrawingProvider({ children }: LineDrawingProviderProps) {
    const [drawingState, setDrawingState] = useState<LineDrawingState>({
        isDrawing: false,
        sourceType: null, // 'menu' or 'connector'
    });
    const isCanvasToolActive = useAppSelector(editorSelectors.selectIsCanvasToolActive);

    useEffect(() => {
        if (isCanvasToolActive) {
            setDrawingState({ isDrawing: false, sourceType: null });
        }
    }, [isCanvasToolActive]);

    return (
        <LineDrawingContext.Provider value={{ drawingState, setDrawingState }}>{children}</LineDrawingContext.Provider>
    );
}
