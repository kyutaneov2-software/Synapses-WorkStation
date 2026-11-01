import React from 'react'
import ReactDOM from 'react-dom/client'

// ── Fonts ─────────────────────────────────────────────────────
// Geist: geometric, modern — the "futuristic minimalism" stack.
// Kept Inter as fallback in tokens.css in case Geist isn't installed.
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'

// ── Styles ────────────────────────────────────────────────────
// Cascade order matters. Do not reorder without reading the
// comment blocks in each file — later imports override earlier ones.

// Foundation
import './assets/styles/tokens.css'
import './assets/styles/reset.css'

// Structure
import './assets/styles/animations.css'
import './assets/styles/layout.css'
import './assets/styles/icon-rail.css' // ← remove .space-layout from here
import './assets/styles/sidebar.css'
import './assets/styles/subnav.css'

// Feature components
import './assets/styles/tasks.css'
import './assets/styles/quick-add.css'
import './assets/styles/task-item.css'
import './assets/styles/due-picker.css'
import './assets/styles/editable-text.css'
import './assets/styles/project-detail.css'
import './assets/styles/file.css'
import './assets/styles/commission-form.css'
import './assets/styles/phase-list.css'
import './assets/styles/modal.css'
import './assets/styles/overview.css'
import './assets/styles/empty-state.css'
import './assets/styles/all-tasks.css'
import './assets/styles/dashboard.css'
import './assets/styles/notes.css'
import './assets/styles/icons.css'

// Theme — overrides surfaces/shadows/radii on structural elements
import './assets/styles/theme.css'

// Responsive — always last
import './assets/styles/responsive.css'

import App from './App'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)
