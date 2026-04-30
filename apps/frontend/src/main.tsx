import { Buffer } from "buffer";
import Konva from "konva";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { App } from "./App";
import { createStore } from "./application/store";
import "./index.css";
import { reportWebVitals } from "./reportWebVitals";

// @react-pdf/renderer needs Node's Buffer global; Vite doesn't polyfill it.
const globalWithBuffer = globalThis as typeof globalThis & { Buffer?: typeof Buffer };
globalWithBuffer.Buffer ??= Buffer;

// Cap canvas pixel ratio at 2 — beyond that the gain is invisible but fill cost grows quadratically (3× retina = 9× pixels).
Konva.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

const store = createStore();
const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
    <StrictMode>
        <Provider store={store}>
            <App />
        </Provider>
    </StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

export { store };
