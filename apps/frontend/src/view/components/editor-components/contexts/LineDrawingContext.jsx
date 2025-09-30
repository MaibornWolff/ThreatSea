import { createContext, useContext } from "react";

export const LineDrawingContext = createContext();

export function useLineDrawing() {
    return useContext(LineDrawingContext);
}
