import { ipcMain, Notification } from "electron";
import db from "../db";
import type { Task, Project } from "../../shared/types";

export function registerSystemHandlers(): void {
    ipcMain.handle(
        "db:health-check",
        (): { alive: number } =>
            db.prepare("SELECT 1 as alive").get() as { alive: number },
    );

    ipcMain.handle("system:test-notification", (): void => {
        console.log("═══════════════════════════════════════════");
        console.log("[test-notification] handler fired");
        console.log(
            "[test-notification] Notification.isSupported():",
            Notification.isSupported(),
        );

        if (!Notification.isSupported()) {
            console.warn(
                "[test-notification] Notifications not supported on this system",
            );
            return;
        }

        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

        const tasks = db
            .prepare(
                `
          SELECT t.*, p.title as project_title
          FROM tasks t
          LEFT JOIN projects p ON t.project_id = p.id
          WHERE t.due_date = ? AND t.done = 0
        `,
            )
            .all(todayStr) as (Task & { project_title: string | null })[];

        const projects = db
            .prepare(
                `SELECT * FROM projects WHERE due_date = ? AND status != 'completed' AND archived = 0`,
            )
            .all(todayStr) as Project[];

        const total = tasks.length + projects.length;
        console.log(`[test-notification] ${total} items due today`);

        const notification = new Notification({
            title:
                total > 0 ? `📌 ${total} items due today` : "Test notification",
            body:
                total > 0
                    ? tasks
                          .slice(0, 3)
                          .map((t) => `• ${t.text}`)
                          .join("\n")
                    : "No items due today — this is what silence looks like.",
        });

        notification.on("show", () =>
            console.log("[test-notification] ✅ SHOW EVENT FIRED"),
        );
        notification.on("click", () =>
            console.log("[test-notification] 👆 CLICK EVENT FIRED"),
        );
        notification.on("close", () =>
            console.log("[test-notification] ❌ CLOSE EVENT FIRED"),
        );
        notification.on("failed", (_, err) =>
            console.error("[test-notification] 💥 FAILED EVENT:", err),
        );

        console.log("[test-notification] calling .show()…");
        notification.show();
        console.log("[test-notification] .show() returned");
    });
}
