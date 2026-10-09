import fs from "fs";
import path from "path";
import { app } from "electron";
import db from "./index";

interface LegacyTask {
    text?: string;
    title?: string;
    done?: boolean;
    completed?: boolean;
}

export function migrateLegacyJson(): void {
    const legacyPath = path.join(app.getPath("userData"), "tasks.json");

    if (!fs.existsSync(legacyPath)) {
        console.log("No legacy tasks.json found. Skipping migration.");
        return;
    }

    const existingTasks = db
        .prepare("SELECT COUNT(*) as count FROM tasks")
        .get() as { count: number };
    if (existingTasks.count > 0) {
        console.log("Database already has tasks. Skipping JSON migration.");
        return;
    }

    console.log("Migrating legacy tasks.json into SQLite...");

    try {
        const rawData = fs.readFileSync(legacyPath, "utf-8");
        const legacyTasks: unknown = JSON.parse(rawData);

        if (!Array.isArray(legacyTasks)) {
            console.warn("Legacy JSON was not an array. Migration skipped.");
            return;
        }

        // Create a default project for these migrated tasks
        const insertProject = db.prepare(`
      INSERT INTO projects (title, client, type, status)
      VALUES (?, ?, ?, ?)
    `);
        const projectResult = insertProject.run(
            "Personal",
            "Self",
            "Personal",
            "active",
        );
        const projectId = projectResult.lastInsertRowid as number;

        // Prepare task insertion
        const insertTask = db.prepare(`
      INSERT INTO tasks (project_id, text, done, created_at)
      VALUES (?, ?, ?, ?)
    `);

        // Insert tasks in a transaction for speed and safety
        const insertMany = db.transaction((tasks: LegacyTask[]) => {
            for (const task of tasks) {
                const text = task.text || task.title || "Untitled Task";
                const done = task.done || task.completed ? 1 : 0;

                insertTask.run(projectId, text, done, new Date().toISOString());
            }
        });

        insertMany(legacyTasks as LegacyTask[]);

        // Rename the old file so we know it's been migrated
        fs.renameSync(legacyPath, `${legacyPath}.migrated`);
        console.log(`Successfully migrated ${legacyTasks.length} tasks!`);
    } catch (error) {
        console.error("Migration failed:", error);
    }
}
