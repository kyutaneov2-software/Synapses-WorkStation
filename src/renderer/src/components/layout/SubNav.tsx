import { NavLink } from 'react-router-dom'
import { ROUTES } from '../../lib/routes'

const TABS = [
    { to: ROUTES.tasksToday, label: 'Today' },
    { to: ROUTES.tasksTomorrow, label: 'Tomorrow' },
    { to: ROUTES.tasksAll, label: 'All Tasks' }
]

export function SubNav(): React.JSX.Element {
    return (
        <nav className="subnav">
            {TABS.map((t) => (
                <NavLink
                    key={t.to}
                    to={t.to}
                    className={({ isActive }) => `subnav-tab ${isActive ? 'active' : ''}`}
                >
                    {t.label}
                </NavLink>
            ))}
        </nav>
    )
}
