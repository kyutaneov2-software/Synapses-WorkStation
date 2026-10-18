import { NavLink } from 'react-router-dom'
import {
    Home,
    FolderKanban,
    StickyNote,
    Calendar,
    Target,
    Settings,
    Zap,
    CheckSquare
} from 'lucide-react'
import { ROUTES } from '../../lib/routes'

const iconSize = 18
const stroke = 1.8

export function IconRail(): React.JSX.Element {
    return (
        <nav className="icon-rail" aria-label="Spaces">
            <div className="icon-rail-top">
                <NavLink
                    to={ROUTES.home}
                    className={({ isActive }) => `icon-rail-btn ${isActive ? 'active' : ''}`}
                    title="Home"
                >
                    <Home size={iconSize} strokeWidth={stroke} />
                </NavLink>

                {/* NEW: Tasks Space */}
                <NavLink
                    to={ROUTES.tasksToday}
                    className={({ isActive }) => `icon-rail-btn ${isActive ? 'active' : ''}`}
                    title="Tasks"
                >
                    <CheckSquare size={iconSize} strokeWidth={stroke} />
                </NavLink>

                {/* RENAMED: Projects Space */}
                <NavLink
                    to={ROUTES.projects}
                    className={({ isActive }) => `icon-rail-btn ${isActive ? 'active' : ''}`}
                    title="Projects"
                >
                    <FolderKanban size={iconSize} strokeWidth={stroke} />
                </NavLink>

                <NavLink
                    to={ROUTES.notes}
                    className={({ isActive }) => `icon-rail-btn ${isActive ? 'active' : ''}`}
                    title="Notes"
                >
                    <StickyNote size={iconSize} strokeWidth={stroke} />
                </NavLink>

                <NavLink
                    to={ROUTES.schedule}
                    className={({ isActive }) => `icon-rail-btn ${isActive ? 'active' : ''}`}
                    title="Schedule"
                >
                    <Calendar size={iconSize} strokeWidth={stroke} />
                </NavLink>

                <NavLink
                    to={ROUTES.goals}
                    className={({ isActive }) => `icon-rail-btn ${isActive ? 'active' : ''}`}
                    title="Goals"
                >
                    <Target size={iconSize} strokeWidth={stroke} />
                </NavLink>
            </div>

            <div className="icon-rail-bottom">
                <button
                    className="icon-rail-btn"
                    onClick={() => window.api.focusToggle()}
                    title="Toggle Focus window (Ctrl+Shift+F)"
                    aria-label="Toggle Focus window"
                >
                    <Zap size={iconSize} strokeWidth={stroke} />
                </button>

                <NavLink
                    to={ROUTES.settings}
                    className={({ isActive }) => `icon-rail-btn ${isActive ? 'active' : ''}`}
                    title="Settings"
                >
                    <Settings size={iconSize} strokeWidth={stroke} />
                </NavLink>
            </div>
        </nav>
    )
}
