import { useState, type ReactNode } from "react";
import { LineDrawingContext, type LineDrawingState } from "./LineDrawingContext";

interface LineDrawingProviderProps {
    children: ReactNode;
}

export function LineDrawingProvider({ children }: LineDrawingProviderProps) {
    const [drawingState, setDrawingState] = useState<LineDrawingState>({
        isDrawing: false,
        sourceType: null, // 'menu' or 'connector'
    });

    return (
        <LineDrawingContext.Provider value={{ drawingState, setDrawingState }}>{children}</LineDrawingContext.Provider>
    );
}
