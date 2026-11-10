
```markdown
# Synapses WorkStation

> Focus. Track. Deliver.

A premium, all-in-one commission-tracking desktop application built for solo freelancers. Designed around the way real work happens: one task at a time, with your deadlines, focus time, and money always visible.

---

## What It Does

Synapses WorkStation is a desktop app that combines project management, task tracking, rich-text note-taking, and file organization — all in one place.

**Core features:**

- **Tasks & Projects (Separated)** — A dedicated 3-column dashboard for Today, Tomorrow, and All Tasks. A separate space for managing Projects, clients, hourly rates, and payment phases (Deposit, Milestone, Final) with live money totals.
- **Appearance Engine** — Full Light/Dark mode support (including OS System sync), 5 custom accent colors (Blue, Ember, Violet, Emerald, Rose), and custom username greetings. The entire app re-themes instantly via CSS variables.
- **Premium Dashboard** — A "Command Deck" layout featuring a live clock, compact horizontal financial summary, and project health bars. All charts (Line and Doughnut) are hand-coded SVGs.
- **Focus Window** — An always-on-top floating widget that shows your current task. Complete it with one click, auto-advances to the next. Global hotkey `Ctrl+Shift+F`. Features a subtle animated "Synapses Core" mascot that reacts to active focus sessions.
- **Session timer** — Start/stop time tracking on any task. The Dashboard aggregates tracked hours per project.
- **Rich Text Notes** — A Notion-style block editor with a floating toolbar. Supports bold, italic, headings, lists, native checkboxes, and safe external links. Features auto-saving, topic tags, and project linking. HTML is strictly sanitized for security.
- **File Attachments** — Attach contracts, briefs, or final deliverables directly to projects. Files are safely copied to the app's local storage so they never break if you move the originals. Open them with a single click.
- **Deadline notifications** — Native OS notifications at 8 AM (what's due today) and 5 PM (what slipped). Can be toggled on/off in Settings.
- **Cross-window sync** — Every window updates instantly when data changes anywhere via IPC broadcasting.
- **System Tray** — Quick access to Settings, Focus Window, and Quit via the OS system tray.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Electron 39 |
| Main process | TypeScript + better-sqlite3 |
| Renderer | React 19 + TypeScript |
| Build tool | electron-vite + Vite 7 |
| Database | SQLite (with WAL mode) |
| Animations | Framer Motion |
| Icons | Lucide React |
| Fonts | Geist Variable + Geist Mono Variable |
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
│   │   ├── settings.ts      # Settings validation & updates
│   │   └── ...
│   ├── services/            # Cross-cutting concerns
│   │   ├── broadcast.ts     # Cross-window event dispatch
│   │   ├── settings.ts      # JSON settings persistence (atomic writes)
│   │   ├── tray.ts          # System tray management
│   │   └── notifications.ts # Scheduled deadline alerts
│   └── focusWindow.ts       # Floating widget management
├── preload/                 # Secure IPC bridge
├── renderer/
│   └── src/
│       ├── spaces/          # Top-level route views (Tasks, Projects, Notes, Home)
│       ├── views/           # Sub-views (Today, Dashboard, ProjectDetail, etc.)
│       ├── components/      # UI grouped by domain
│       │   ├── layout/      # SplashScreen, ErrorBoundary, ThemeMount, IconRail
│       │   ├── common/      # SynapsesMascot, TagInput, etc.
│       │   └── ...
│       ├── lib/
│       │   ├── hooks/       # useLiveData, useSettings, useProjects, etc.
│       │   └── ...
│       └── assets/          # Design system CSS
└── shared/                  # Types and helpers shared across processes
```

**Key principles:**

- **Everything writes to SQLite in the main process.** The renderer never touches the DB directly.
- **All writes broadcast a `data:changed` event.** Every window subscribes and refreshes automatically.
- **Settings broadcast a `settings:changed` event.** The renderer applies the theme instantly via `ThemeMount`.
- **Only one running session at a time.** Starting a new one auto-closes the previous.
- **Rich text is sanitized.** Note HTML goes through a strict allow-list sanitizer before saving/rendering.
- **Framer Motion handles physics.** Layouts, page transitions, and list shifts are animated cleanly on the GPU.

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

Your database, settings, and attachments live in your OS's user data folder:

| OS | Path |
|---|---|
| Windows | `%APPDATA%\Synapses WorkStation\` |
| macOS | `~/Library/Application Support/Synapses WorkStation/` |
| Linux | `~/.config/Synapses WorkStation/` |

Files:
- `task-notes.db` — SQLite database (all your data)
- `task-notes.db-wal` / `task-notes.db-shm` — SQLite write-ahead log files (managed automatically)
- `settings.json` — Theme, accent, user preferences, and focus window position
- `attachments/` — Folder containing all files attached to projects

**Back up `task-notes.db` and the `attachments/` folder regularly.** Your entire work history lives in that one file and folder.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+F` | Toggle the Focus window |
| `Ctrl+B` | Bold text (in Notes editor) |
| `Ctrl+I` | Italic text (in Notes editor) |
| `Enter` (in composer) | Create a task |
| `Escape` (in composer) | Clear + collapse |
| `Ctrl+Enter` (multiline editor) | Commit edit |

---

## Design System

The UI uses a token-based design system defined in `src/renderer/src/assets/styles/tokens.css`:

- **Themes** — Full support for Dark and Light modes. The `[data-theme="light"]` token block overrides surfaces, borders, text, and shadows.
- **Accents** — 5 dynamic palettes that swap `--accent`, `--accent-hover`, and `--accent-glow`. The entire UI (buttons, focus rings, charts, mascot) responds instantly.
- **Colors** — layered surface (`--bg-0` through `--bg-4`), text scale (`--text-0` to `--text-3`), semantic accents (`--success`, `--warning`, `--danger`, `--purple`)
- **Motion** — Custom cubic-beziers (`--ease-out`, `--ease-spring`) for a fluid, "Apple-like" feel. Framer Motion uses `stiffness: 500, damping: 35` for snappy modals and lists.
- **Typography** — Geist Variable for UI text, Geist Mono Variable for all numbers (money, timers, counts). Both bundled locally via `@fontsource-variable` — no CDN dependency.

---

## Roadmap

- [x] SQLite data layer with migrations (up to v11)
- [x] Projects, tasks, payment phases
- [x] Focus window with session timer & pixel mascot
- [x] Deadline notifications (with toggle in Settings)
- [x] Premium "Command Deck" Dashboard
- [x] 3-Column Tasks layout
- [x] Rich Text Notes (Auto-save, sanitization, floating toolbar)
- [x] File attachments (drag-and-drop onto projects)
- [x] Settings panel (Theme, Accents, Profile, Preferences)
- [x] Light theme & dynamic accent colors
- [x] System Tray menu
- [x] App Splash Screen & Error Boundary
- [ ] Command Palette (`Ctrl+K`)
- [ ] Undo delete toast
- [ ] CSV export for invoicing
- [ ] First-run onboarding

---

## Development Notes

**Native module rebuilds:**
If `better-sqlite3` fails to load after a fresh install, run:
```bash
npx electron-rebuild -f -w better-sqlite3
```

**Timezone handling:**
All SQLite date queries use `date('now', 'localtime')` — never bare `date('now')`, which is UTC. This matters for scheduling tasks and grouping focus sessions across day boundaries.

**Notification setup on Windows:**
Windows requires the app to have a Start Menu shortcut matching its AppUserModelID (`com.synapses.workstation`) to route notifications correctly. The installer creates this automatically. In dev mode, the AUMID is set to `process.execPath` to work around the missing shortcut.

**HTML Sanitization:**
The Rich Text Notes feature uses a custom `sanitizeHtml` function that parses DOM nodes with `DOMParser` and whitelists safe tags (b, i, ul, ol, h2, a, input[type=checkbox]). Scripts and styles are stripped to prevent XSS.

**Modals & AnimatePresence:**
To ensure exit animations play correctly, all modals (e.g., `ProjectEditModal`) must be wrapped in `<AnimatePresence>` at their parent level.

---

## License

Private project. Not licensed for redistribution.

---

## Copyright (c) 2026 Jeremy

All Rights Reserved.

This source code is provided for portfolio and demonstration purposes.
No permission is granted to copy, modify, distribute, sublicense, or
sell this software or any portion of it without the express written
consent of the copyright holder.
```
