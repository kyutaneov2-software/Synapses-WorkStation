import Database from "better-sqlite3";
import type { Database as DatabaseType } from "better-sqlite3";
import { app } from "electron";
import path from "path";
import schemaSql from "./schema.sql?raw";

const dbPath = path.join(app.getPath("userData"), "task-notes.db");
const db: DatabaseType = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma("journal_mode = WAL");

export function runMigrations(): void {
    const userVersion = db.pragma("user_version", { simple: true }) as number;

    if (userVersion < 1) {
        console.log("Running migration to version 1...");
        db.exec(schemaSql);
        db.pragma("user_version = 1");
    }

    if (userVersion < 2) {
        console.log("Running migration to version 2 — project currency...");
        // Add currency column to projects
        db.exec(`ALTER TABLE projects ADD COLUMN currency TEXT DEFAULT 'USD'`);
        // Backfill from existing phases
        db.exec(`
      UPDATE projects
      SET currency = (
        SELECT currency FROM project_phases
        WHERE project_phases.project_id = projects.id
        ORDER BY sort_order ASC
        LIMIT 1
      )
      WHERE EXISTS (
        SELECT 1 FROM project_phases WHERE project_phases.project_id = projects.id
      )
    `);
        db.pragma("user_version = 2");
    }
}

export default db;
