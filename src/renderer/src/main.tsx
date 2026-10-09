import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";

// Styles — order matters (base → tokens → layout → components → responsive)
import "./assets/styles/tokens.css";
import "./assets/styles/reset.css";
import "./assets/styles/animations.css";
import "./assets/styles/layout.css";
import "./assets/styles/sidebar.css";
import "./assets/styles/quick-add.css";
import "./assets/styles/task-item.css";
import "./assets/styles/due-picker.css";
import "./assets/styles/editable-text.css";
import "./assets/styles/project-detail.css";
import "./assets/styles/phase-list.css";
import "./assets/styles/modal.css";
import "./assets/styles/empty-state.css";
import "./assets/styles/all-tasks.css";
import "./assets/styles/dashboard.css";
import "./assets/styles/icons.css";
import "./assets/styles/responsive.css";

import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
