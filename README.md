

# Synapses WorkStation

> Focus. Track. Deliver.

A commission-tracking task manager and focus companion built for solo freelancers. Designed around the way real work happens: one task at a time, with your deadline and your money always visible.

---

## What It Does

Synapses WorkStation is a desktop app that combines task management, project tracking, payment phases, and a live focus widget — all in one place.

**Core features:**

- **Projects** — create projects, track clients, define start/due dates, hourly rates, and briefs
- **Tasks** — assign to projects, set due dates and priorities, plan for Today or Tomorrow
- **Payment phases** — split a project into phases (Deposit, Milestone 1, Final), track what's paid vs. outstanding with live money totals
- **Focus Window** — an always-on-top floating widget that shows your current task. Complete it with one click, auto-advances to the next. Global hotkey `Ctrl+Shift+F`.
- **Session timer** — start/stop time tracking on any task. Dashboard aggregates tracked hours per project.
- **Deadline notifications** — native OS notifications at 8 AM (what's due today) and 5 PM (what slipped)
- **Dashboard** — money summary (earned / outstanding / this month), deadlines this week, project health bars, tracked time
- **Cross-window sync** — every window updates instantly when data changes anywhere

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Electron 39 |
| Main process | TypeScript + better-sqlite3 |
| Renderer | React 19 + TypeScript |
| Build tool | electron-vite + Vite 7 |
| Database | SQLite (with WAL mode) |
| Fonts | Inter Variable + JetBrains Mono Variable |
| Scheduling | node-schedule |
| Packaging | electron-builder |

---

## Architecture

```
src/
├── main/                    # Node.js process (has DB access)
│   ├── index.ts             # App lifecycle, window creation
│   ├── db/                  # SQLite setup, migrations, schema
│   ├── ipc/                 # IPC handlers split by domain
│   │   ├── projects.ts
│   │   ├── tasks.ts
│   │   ├── phases.ts
│   │   ├── sessions.ts
│   │   ├── focus.ts
│   │   ├── dashboard.ts
│   │   └── system.ts
│   ├── services/            # Cross-cutting concerns
│   │   ├── broadcast.ts     # Cross-window event dispatch
│   │   ├── settings.ts      # JSON settings persistence
│   │   └── notifications.ts # Scheduled deadline alerts
│   └── focusWindow.ts       # Floating widget management
├── preload/                 # Secure IPC bridge
├── renderer/
│   └── src/
│       ├── views/           # Today, Tomorrow, AllTasks, Dashboard, ProjectDetail
│       ├── components/      # UI by domain
│       ├── lib/
│       │   ├── hooks/       # useLiveData, useProjects, useTasks, usePhases
│       │   ├── dates.ts
│       │   └── time.ts
│       └── assets/          # Design system CSS
└── shared/                  # Types shared across processes
```

**Key principles:**

- **Everything writes to SQLite in the main process.** The renderer never touches the DB directly.
- **All writes broadcast a `data:changed` event.** Every window subscribes and refreshes automatically.
- **Only one running session at a time.** Starting a new one auto-closes the previous.
- **The Focus window runs from its own HTML entry** (`focus.html`) sharing the same preload bridge.

---

## Installation

### Prerequisites

- **Node.js** 20 or higher
- **Windows** 10/11 (macOS and Linux builds are configured but untested)

### Setup

```bash
git clone https://github.com/yourname/synapses-workstation.git
cd synapses-workstation
npm install
```

`better-sqlite3` compiles as a native module. The `postinstall` script handles this automatically via `electron-builder install-app-deps`.

### Development

```bash
npm run dev
```

Opens the Electron window with hot-reload for the renderer and main process.

### Build Installers

```bash
# Windows installer + portable .exe
npm run build:win

# macOS .dmg (requires macOS or a valid signing cert)
npm run build:mac

# Linux .AppImage / .deb
npm run build:linux
```

Output lands in `dist/`.

---

## Data Location

Your database and settings live in your OS's user data folder:

| OS | Path |
|---|---|
| Windows | `%APPDATA%\Synapses WorkStation\` |
| macOS | `~/Library/Application Support/Synapses WorkStation/` |
| Linux | `~/.config/Synapses WorkStation/` |

Files:
- `task-notes.db` — SQLite database (all your data)
- `task-notes.db-wal` / `task-notes.db-shm` — SQLite write-ahead log files (managed automatically)
- `settings.json` — Focus window position, future preferences

**Back up `task-notes.db` regularly.** Your entire work history lives in that one file.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+F` | Toggle the Focus window |
| `Enter` (in composer) | Create a task |
| `Escape` (in composer) | Clear + collapse |
| `Ctrl+Enter` (multiline editor) | Commit edit |

---

## Design System

The UI uses a token-based design system defined at the top of `src/renderer/src/assets/index.css`:

- **Colors** — layered surface (`--bg-0` through `--bg-3`), text scale (`--text-0` to `--text-3`), semantic accents (`--accent`, `--success`, `--warning`, `--danger`, `--purple`)
- **Radii** — `--radius-sm` (4px) through `--radius-xl` (14px)
- **Motion** — `--ease-out`, `--ease-spring`, durations at 120ms / 200ms / 320ms

**Fonts:** Inter Variable for UI text, JetBrains Mono Variable for all numbers (money, timers, counts). Both bundled locally via `@fontsource-variable` — no CDN dependency, works offline.

---

## Roadmap

- [x] SQLite data layer with migrations
- [x] Projects, tasks, payment phases
- [x] Focus window with session timer
- [x] Deadline notifications
- [x] Dashboard with money + health metrics
- [x] Modern design system
- [ ] File attachments (drag-and-drop onto projects)
- [ ] Settings panel (configurable notification times, default currency)
- [ ] CSV export for invoicing
- [ ] Database backup / restore
- [ ] Light theme

---

## Development Notes

**Native module rebuilds:**
If `better-sqlite3` fails to load after a fresh install, run:
```bash
npx electron-rebuild -f -w better-sqlite3
```

**Timezone handling:**
All SQLite date queries use `date('now', 'localtime')` — never bare `date('now')`, which is UTC. This matters for scheduling tasks across day boundaries.

**Notification setup on Windows:**
Windows requires the app to have a Start Menu shortcut matching its AppUserModelID (`com.synapses.workstation`) to route notifications correctly. The installer creates this automatically. In dev mode, the AUMID is set to `process.execPath` to work around the missing shortcut.

---

## License

Private project. Not licensed for redistribution.

---

Built with care, for one developer's brain.

## Why This Structure

| Section | Purpose |
|---|---|
| **What It Does** | Tells a stranger (or future you) what the app actually is in 30 seconds |
| **Tech Stack** | Quick version-at-a-glance for upgrades and compatibility checks |
| **Architecture** | Documents the folder structure and the *principles* behind it — critical when you come back in 6 months |
| **Installation** | Matches your actual workflow (git clone → npm install → npm run dev) |
| **Data Location** | Points you to the database file for backups — the single most important operational fact |
| **Keyboard Shortcuts** | Reference for daily use |
| **Design System** | Explains the token approach so you can extend it without breaking it |
| **Roadmap** | Checkboxes as a living todo — you can update it as you ship |
| **Development Notes** | Captures the three hard-won lessons: native rebuilds, timezone bug, Windows notifications |
| **License** | Explicitly states this is private — protects you if the repo ever goes public |

