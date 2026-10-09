import { ipcMain } from "electron";
import { registerProjectHandlers } from "./projects";
import { registerTaskHandlers } from "./tasks";
import { registerPhaseHandlers } from "./phases";
import { registerFocusHandlers } from "./focus";
import { registerSystemHandlers } from "./system";
import { registerDashboardHandlers } from "./dashboard";
import { registerSessionHandlers } from "./sessions";

const ALL_CHANNELS = [
    // Projects
    "db:get-projects",
    "db:create-project",
    "db:update-project",
    "db:delete-project",
    // Tasks
    "db:get-tasks",
    "db:get-tasks-by-view",
    "db:get-tasks-by-project",
    "db:create-task",
    "db:toggle-task",
    "db:update-task",
    "db:delete-task",
    // Phases
    "db:get-phases",
    "db:create-phase",
    "db:update-phase",
    "db:delete-phase",
    // Focus window
    "focus:toggle",
    "focus:get-current",
    "focus:complete",
    "focus:quick-add-tomorrow",
    "focus:pin-task",
    // Sessions
    "session:start",
    "session:stop",
    "session:get-active",
    "session:get-totals",
    // Dashboard
    "dashboard:get-data",
    // System
    "db:health-check",
];

function clearExistingHandlers(): void {
    for (const channel of ALL_CHANNELS) {
        ipcMain.removeHandler(channel);
    }
}

export function registerAllIpcHandlers(): void {
    clearExistingHandlers();

    registerProjectHandlers();
    registerTaskHandlers();
    registerPhaseHandlers();
    registerFocusHandlers();
    registerSystemHandlers();
    registerDashboardHandlers();
    registerSessionHandlers();

    console.log("[ipc] all handlers registered");
}
