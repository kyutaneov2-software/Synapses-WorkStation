import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import schemaSql from './schema.sql?raw'

const dbPath = path.join(app.getPath('userData'), 'task-notes.db')
const db: DatabaseType = new Database(dbPath)

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL')

export function runMigrations(): void {
    const userVersion = db.pragma('user_version', { simple: true }) as number

    if (userVersion < 1) {
        console.log('Running migration to version 1...')
        db.exec(schemaSql)
        db.pragma('user_version = 1')
    }

    if (userVersion < 2) {
        console.log('Running migration to version 2 — project currency...')
        // Add currency column to projects
        db.exec(`ALTER TABLE projects ADD COLUMN currency TEXT DEFAULT 'USD'`)
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
    `)
        db.pragma('user_version = 2')
    }

    if (userVersion < 3) {
        console.log('Running migration to version 3 — indexes...')
        db.exec(`
            CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
            CREATE INDEX IF NOT EXISTS idx_tasks_planned ON tasks(planned_for);
            CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);
            CREATE INDEX IF NOT EXISTS idx_tasks_done ON tasks(done);
            CREATE INDEX IF NOT EXISTS idx_tasks_current ON tasks(is_current) WHERE is_current = 1;
            CREATE INDEX IF NOT EXISTS idx_phases_project ON project_phases(project_id);
            CREATE INDEX IF NOT EXISTS idx_sessions_task ON sessions(task_id);
            CREATE INDEX IF NOT EXISTS idx_sessions_open ON sessions(ended_at) WHERE ended_at IS NULL;
            CREATE INDEX IF NOT EXISTS idx_attachments_project ON attachments(project_id);
        `)
        db.pragma('user_version = 3')
    }

    if (userVersion < 4) {
        console.log('Running migration to version 4 — commissions expansion...')

        // New columns on projects
        db.exec(`ALTER TABLE projects ADD COLUMN client_contact TEXT`)
        db.exec(`ALTER TABLE projects ADD COLUMN tech_stack TEXT`)
        db.exec(`ALTER TABLE projects ADD COLUMN reference_links TEXT`)

        // Tags (many-to-many)
        db.exec(`
            CREATE TABLE IF NOT EXISTS tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                color TEXT
            );
            CREATE TABLE IF NOT EXISTS project_tags (
                project_id INTEGER NOT NULL,
                tag_id INTEGER NOT NULL,
                PRIMARY KEY (project_id, tag_id),
                FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
                FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_project_tags_tag ON project_tags(tag_id);
        `)

        // Normalize legacy type values ('Personal' from JSON migration, nulls, unknowns)
        db.exec(`
            UPDATE projects SET type = 'other'
            WHERE type IS NULL
               OR type NOT IN ('mobile_app', 'website', 'desktop_app', 'video', 'illustration', 'writing', 'other')
        `)

        db.pragma('user_version = 4')
    }

    if (userVersion < 5) {
        console.log('Running migration to version 5 — money as integer cents...')

        // project_phases.amount (REAL) → amount_cents (INTEGER)
        const phaseCols = db.prepare('PRAGMA table_info(project_phases)').all() as {
            name: string
        }[]
        if (phaseCols.some((c) => c.name === 'amount')) {
            db.exec(`ALTER TABLE project_phases ADD COLUMN amount_cents INTEGER DEFAULT 0`)
            db.exec(`UPDATE project_phases SET amount_cents = CAST(ROUND(amount * 100) AS INTEGER)`)
            db.exec(`ALTER TABLE project_phases DROP COLUMN amount`)
            console.log('  Converted project_phases.amount → amount_cents')
        }

        // projects.hourly_rate (REAL) → hourly_rate_cents (INTEGER)
        const projCols = db.prepare('PRAGMA table_info(projects)').all() as { name: string }[]
        if (projCols.some((c) => c.name === 'hourly_rate')) {
            db.exec(`ALTER TABLE projects ADD COLUMN hourly_rate_cents INTEGER`)
            db.exec(
                `UPDATE projects SET hourly_rate_cents = CAST(ROUND(hourly_rate * 100) AS INTEGER) WHERE hourly_rate IS NOT NULL`
            )
            db.exec(`ALTER TABLE projects DROP COLUMN hourly_rate`)
            console.log('  Converted projects.hourly_rate → hourly_rate_cents')
        }

        db.pragma('user_version = 5')
    }

    if (userVersion < 6) {
        console.log('Running migration to version 6 — notes...')

        db.exec(`
            CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL DEFAULT '',
                body TEXT NOT NULL DEFAULT '',
                topics TEXT,
                project_id INTEGER,
                pinned INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_notes_project ON notes(project_id);
            CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at DESC);
        `)

        db.pragma('user_version = 6')
    }
}

export default db
