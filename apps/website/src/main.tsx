import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.js";
import { applyTheme, getInitialTheme } from "./theme.js";
import "./index.css";

// Apply the theme before first paint so there's no light/dark flash.
applyTheme(getInitialTheme());

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
