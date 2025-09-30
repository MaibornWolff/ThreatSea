import { useState } from "react";
import { LineDrawingContext } from "./LineDrawingContext";

export function LineDrawingProvider({ children }) {
    const [drawingState, setDrawingState] = useState({
        isDrawing: false,
        sourceType: null, // 'menu' or 'connector'
    });

    return (
        <LineDrawingContext.Provider value={{ drawingState, setDrawingState }}>{children}</LineDrawingContext.Provider>
    );
}
