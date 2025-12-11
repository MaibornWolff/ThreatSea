import { createContext, useContext, type Dispatch, type SetStateAction } from "react";

export interface LineDrawingState {
    isDrawing: boolean;
    sourceType: "menu" | "connector" | null;
}

export interface LineDrawingContextValue {
    drawingState: LineDrawingState;
    setDrawingState: Dispatch<SetStateAction<LineDrawingState>>;
}

export const LineDrawingContext = createContext<LineDrawingContextValue | undefined>(undefined);

export function useLineDrawing(): LineDrawingContextValue {
    const context = useContext(LineDrawingContext);
    if (!context) {
        throw new Error("useLineDrawing must be used within a LineDrawingProvider");
    }
    return context;
}
