import React from 'react'
import ReactDOM from 'react-dom/client'

// ── Fonts ─────────────────────────────────────────────────────
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'

// ── Core Design System ────────────────────────────────────────
// The Focus window is a separate entry point, so it needs its own
// access to the tokens and reset. (focus.css overrides the reset's
// solid background to keep the window transparent).
import './assets/styles/tokens.css'
import './assets/styles/reset.css'

// ── Focus Specific Styles ─────────────────────────────────────
import './assets/focus.css'

import FocusApp from './FocusApp'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <FocusApp />
    </React.StrictMode>
)
