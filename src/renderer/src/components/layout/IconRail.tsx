import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, FolderKanban, StickyNote, Settings, Zap, CheckSquare } from 'lucide-react'
import { ROUTES } from '../../lib/routes'

const iconSize = 18
const stroke = 1.8

const SPRING = { type: 'spring', stiffness: 500, damping: 35, mass: 0.8 } as const

interface RailLinkProps {
    to: string
    label: string
    icon: React.ReactNode
    end?: boolean
}

function RailLink({ to, label, icon, end }: RailLinkProps): React.JSX.Element {
    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) => `icon-rail-btn ${isActive ? 'active' : ''}`}
            title={label}
            aria-label={label}
        >
            {({ isActive }) => (
                <motion.div
                    whileTap={{ scale: 0.9 }}
                    transition={SPRING}
                    className="rail-link-inner"
                >
                    {isActive && (
                        <motion.div
                            layoutId="rail-active-indicator"
                            className="rail-active-bar"
                            transition={SPRING}
                        />
                    )}
                    {icon}
                </motion.div>
            )}
        </NavLink>
    )
}

export function IconRail(): React.JSX.Element {
    return (
        <nav className="icon-rail" aria-label="Spaces">
            <div className="icon-rail-top">
                <RailLink
                    to={ROUTES.home}
                    label="Home"
                    icon={<Home size={iconSize} strokeWidth={stroke} />}
                    end
                />
                <RailLink
                    to={ROUTES.tasksToday}
                    label="Tasks"
                    icon={<CheckSquare size={iconSize} strokeWidth={stroke} />}
                />
                <RailLink
                    to={ROUTES.projects}
                    label="Projects"
                    icon={<FolderKanban size={iconSize} strokeWidth={stroke} />}
                />
                <RailLink
                    to={ROUTES.notes}
                    label="Notes"
                    icon={<StickyNote size={iconSize} strokeWidth={stroke} />}
                />
            </div>

            <div className="icon-rail-bottom">
                <button
                    className="icon-rail-btn"
                    onClick={() => window.api.focusToggle()}
                    title="Toggle Focus window (Ctrl+Shift+F)"
                    aria-label="Toggle Focus window"
                >
                    <motion.div
                        whileTap={{ scale: 0.9 }}
                        transition={SPRING}
                        className="rail-link-inner"
                    >
                        <Zap size={iconSize} strokeWidth={stroke} />
                    </motion.div>
                </button>

                <RailLink
                    to={ROUTES.settings}
                    label="Settings"
                    icon={<Settings size={iconSize} strokeWidth={stroke} />}
                />
            </div>
        </nav>
    )
}
