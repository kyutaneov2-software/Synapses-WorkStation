import { Notification } from "electron";
import schedule from "node-schedule";
import db from "../db";
import type { Task, Project } from "../../shared/types";

interface DueItem {
    text: string;
    projectTitle?: string;
    isProject: boolean;
}

function getTodayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDueToday(): DueItem[] {
    const today = getTodayStr();
    const items: DueItem[] = [];

    // Tasks due today (by due_date) — includes done tasks for completeness
    const tasks = db
        .prepare(
            `
        SELECT t.*, p.title as project_title
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.due_date = ?
          AND t.done = 0
        ORDER BY t.priority DESC
      `,
        )
        .all(today) as (Task & { project_title: string | null })[];

    for (const t of tasks) {
        items.push({
            text: t.text,
            projectTitle: t.project_title ?? undefined,
            isProject: false,
        });
    }

    // Projects due today
    const projects = db
        .prepare(
            `
        SELECT * FROM projects
        WHERE due_date = ?
          AND status != 'completed'
          AND archived = 0
      `,
        )
        .all(today) as Project[];

    for (const p of projects) {
        items.push({
            text: p.title,
            isProject: true,
        });
    }

    return items;
}

function getOverdue(): DueItem[] {
    const today = getTodayStr();
    const items: DueItem[] = [];

    const tasks = db
        .prepare(
            `
        SELECT t.*, p.title as project_title
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.done = 0
          AND t.planned_for IS NOT NULL
          AND t.planned_for < ?
        ORDER BY t.planned_for ASC
      `,
        )
        .all(today) as (Task & { project_title: string | null })[];

    for (const t of tasks) {
        items.push({
            text: t.text,
            projectTitle: t.project_title ?? undefined,
            isProject: false,
        });
    }

    return items;
}

function showDeadlineNotification(): void {
    const items = getDueToday();

    if (items.length === 0) {
        console.log(
            "[notifications] Nothing due today. Skipping morning notice.",
        );
        return;
    }

    if (items.length === 1) {
        const item = items[0];
        new Notification({
            title: item.isProject
                ? "📁 Project due today"
                : "📌 Task due today",
            body: item.projectTitle
                ? `${item.text}\n${item.projectTitle}`
                : item.text,
        }).show();
        return;
    }

    // Multiple items — show first 3 + count
    const preview = items
        .slice(0, 3)
        .map((i) => `• ${i.text}`)
        .join("\n");
    const more = items.length > 3 ? `\n…and ${items.length - 3} more` : "";

    new Notification({
        title: `${items.length} things due today`,
        body: `${preview}${more}`,
    }).show();
}

function showOverdueNotification(): void {
    const items = getOverdue();

    if (items.length === 0) {
        console.log(
            "[notifications] Nothing overdue. Skipping evening notice.",
        );
        return;
    }

    if (items.length === 1) {
        new Notification({
            title: "⚠ 1 task overdue",
            body: items[0].text,
        }).show();
        return;
    }

    new Notification({
        title: `⚠ ${items.length} tasks overdue`,
        body: "Open Synapses to see what slipped.",
    }).show();
}

export function startNotificationScheduler(): void {
    // Morning notice at 8:00 AM — what's due today
    schedule.scheduleJob("0 8 * * *", () => {
        console.log("[notifications] Morning deadline check running…");
        showDeadlineNotification();
    });

    // Evening nudge at 5:00 PM — what slipped
    schedule.scheduleJob("0 17 * * *", () => {
        console.log("[notifications] Evening overdue check running…");
        showOverdueNotification();
    });

    console.log("[notifications] Scheduler started (8 AM + 5 PM local time)");
}

export function stopNotificationScheduler(): void {
    schedule.gracefulShutdown();
}
