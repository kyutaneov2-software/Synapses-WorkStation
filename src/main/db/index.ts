import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import schemaSql from './schema.sql?raw'

const dbPath = path.join(app.getPath('userData'), 'task-notes.db')
const db: DatabaseType = new Database(dbPath)

// WAL mode is safe to set at any time.
db.pragma('journal_mode = WAL')

// NOTE: foreign_keys is intentionally left at its default (OFF) during
// migrations. It must be enabled *after* migrations complete, because
// (a) PRAGMA foreign_keys is a no-op inside a transaction, and
// (b) we want the orphan-cleanup migration to be able to run freely.

export function runMigrations(): void {
    // Use a mutable variable so each migration updates the tracker.
    // This is the fix for the "re-run every migration" bug.
    let userVersion = db.pragma('user_version', { simple: true }) as number

    if (userVersion < 1) {
        console.log('Running migration to version 1...')
        db.exec(schemaSql)
        db.pragma('user_version = 1')
        userVersion = 1
    }

    if (userVersion < 2) {
        console.log('Running migration to version 2 — project currency...')
        db.exec(`ALTER TABLE projects ADD COLUMN currency TEXT DEFAULT 'USD'`)
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
        userVersion = 2
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
        userVersion = 3
    }

    if (userVersion < 4) {
        console.log('Running migration to version 4 — commissions expansion...')
        db.exec(`ALTER TABLE projects ADD COLUMN client_contact TEXT`)
        db.exec(`ALTER TABLE projects ADD COLUMN tech_stack TEXT`)
        db.exec(`ALTER TABLE projects ADD COLUMN reference_links TEXT`)

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

        db.exec(`
            UPDATE projects SET type = 'other'
            WHERE type IS NULL
               OR type NOT IN ('mobile_app', 'website', 'desktop_app', 'video', 'illustration', 'writing', 'other')
        `)

        db.pragma('user_version = 4')
        userVersion = 4
    }

    if (userVersion < 5) {
        console.log('Running migration to version 5 — money as integer cents...')

        const phaseCols = db.prepare('PRAGMA table_info(project_phases)').all() as {
            name: string
        }[]
        if (phaseCols.some((c) => c.name === 'amount')) {
            db.exec(`ALTER TABLE project_phases ADD COLUMN amount_cents INTEGER DEFAULT 0`)
            db.exec(`UPDATE project_phases SET amount_cents = CAST(ROUND(amount * 100) AS INTEGER)`)
            db.exec(`ALTER TABLE project_phases DROP COLUMN amount`)
            console.log('  Converted project_phases.amount → amount_cents')
        }

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
        userVersion = 5
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
        userVersion = 6
    }

    if (userVersion < 7) {
        console.log('Running migration to version 7 — orphan cleanup before FK enforcement...')

        // Because foreign keys have never been enforced, existing databases
        // may contain rows whose parent has been deleted. Turning on FK
        // enforcement won't retroactively break anything, but it's cleaner
        // to remove the orphans now while we have a chance.
        //
        // Order matters: delete children of orphans first, then the orphan
        // parents themselves.
        const cleanup = db.transaction(() => {
            // Leaf-level orphans (no children of their own)
            db.exec(`DELETE FROM project_phases WHERE project_id NOT IN (SELECT id FROM projects)`)
            db.exec(`DELETE FROM attachments WHERE project_id NOT IN (SELECT id FROM projects)`)
            db.exec(
                `DELETE FROM notes WHERE project_id IS NOT NULL AND project_id NOT IN (SELECT id FROM projects)`
            )
            db.exec(
                `DELETE FROM project_tags WHERE project_id NOT IN (SELECT id FROM projects) OR tag_id NOT IN (SELECT id FROM tags)`
            )
            // Sessions whose task is already gone
            db.exec(
                `DELETE FROM sessions WHERE task_id IS NOT NULL AND task_id NOT IN (SELECT id FROM tasks)`
            )
            // Now tasks whose project is gone (this may orphan more sessions)
            db.exec(
                `DELETE FROM tasks WHERE project_id IS NOT NULL AND project_id NOT IN (SELECT id FROM projects)`
            )
            // And finally those newly orphaned sessions
            db.exec(
                `DELETE FROM sessions WHERE task_id IS NOT NULL AND task_id NOT IN (SELECT id FROM tasks)`
            )
        })
        cleanup()

        db.pragma('user_version = 7')
        userVersion = 7
    }

    if (userVersion < 8) {
        console.log('Running migration to version 8 — schedule blocks...')

        db.exec(`
            CREATE TABLE IF NOT EXISTS schedule_blocks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER NOT NULL,
                start_at TEXT NOT NULL,        -- "YYYY-MM-DD HH:MM" (local, no TZ suffix)
                end_at TEXT NOT NULL,          -- "YYYY-MM-DD HH:MM"
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_blocks_task ON schedule_blocks(task_id);
            CREATE INDEX IF NOT EXISTS idx_blocks_start ON schedule_blocks(start_at);
        `)

        db.pragma('user_version = 8')
        userVersion = 8
    }

    if (userVersion < 9) {
        console.log('Running migration to version 9 — support for generic events...')

        // SQLite requires a table rebuild to change a column to NULLABLE
        db.exec(`
            CREATE TABLE schedule_blocks_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER,
                title TEXT,
                event_type TEXT DEFAULT 'task',
                start_at TEXT NOT NULL,
                end_at TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
            );

            INSERT INTO schedule_blocks_new (id, task_id, start_at, end_at, created_at)
            SELECT id, task_id, start_at, end_at, created_at FROM schedule_blocks;

            DROP TABLE schedule_blocks;
            ALTER TABLE schedule_blocks_new RENAME TO schedule_blocks;

            CREATE INDEX IF NOT EXISTS idx_blocks_task ON schedule_blocks(task_id);
            CREATE INDEX IF NOT EXISTS idx_blocks_start ON schedule_blocks(start_at);
        `)

        db.pragma('user_version = 9')
        userVersion = 9
    }

    if (userVersion < 10) {
        console.log('Running migration to version 10 — goals...')
        db.exec(`
            CREATE TABLE IF NOT EXISTS goals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                target_date TEXT,
                progress INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                archived INTEGER DEFAULT 0
            );
            CREATE INDEX IF NOT EXISTS idx_goals_archived ON goals(archived);
        `)
        db.pragma('user_version = 10')
        userVersion = 10
    }

    if (userVersion < 11) {
        console.log('Running migration to version 11 — goal types and logs...')

        // Add type and target to goals
        db.exec(`ALTER TABLE goals ADD COLUMN type TEXT DEFAULT 'everyday'`)
        db.exec(`ALTER TABLE goals ADD COLUMN target_value REAL DEFAULT 1`)
        db.exec(`ALTER TABLE goals ADD COLUMN target_unit TEXT`)

        // Create the logs table
        db.exec(`
            CREATE TABLE IF NOT EXISTS goal_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                goal_id INTEGER NOT NULL,
                date TEXT NOT NULL,          -- YYYY-MM-DD
                value REAL NOT NULL DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (goal_id) REFERENCES goals (id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_goal_logs_goal ON goal_logs(goal_id);
            CREATE INDEX IF NOT EXISTS idx_goal_logs_date ON goal_logs(date);
        `)

        db.pragma('user_version = 11')
        userVersion = 11
    }

    // Enable foreign key enforcement for the rest of the app's lifetime.
    // Must be outside a transaction — it's a silent no-op inside one.
    db.pragma('foreign_keys = ON')
    console.log(`[db] migrations complete (v${userVersion}), foreign_keys = ON`)
}

export default db
