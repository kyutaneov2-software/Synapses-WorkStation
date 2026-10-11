import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useProjects } from '../../lib/hooks'
import { ROUTES } from '../../lib/routes'

export function Sidebar(): React.JSX.Element {
    const { projects } = useProjects()
    const navigate = useNavigate()
    const location = useLocation()

    const [creating, setCreating] = useState(false)
    const [title, setTitle] = useState('')
    const [client, setClient] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const match = location.pathname.match(/^\/commissions\/project\/(\d+)/)
    const activeProjectId = match ? Number(match[1]) : null

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault()
        const trimmedTitle = title.trim()
        if (!trimmedTitle || submitting) return

        setSubmitting(true)
        try {
            const project = await window.api.createProject(trimmedTitle, client.trim() || 'Self')
            setTitle('')
            setClient('')
            setCreating(false)
            navigate(ROUTES.commissionsProject(project.id))
        } finally {
            setSubmitting(false)
        }
    }

    const handleCancel = (): void => {
        setCreating(false)
        setTitle('')
        setClient('')
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h3>Projects</h3>
                <button className="new-btn" title="New Project" onClick={() => setCreating(true)}>
                    +
                </button>
            </div>

            {creating && (
                <form className="new-project-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Project name"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        autoFocus
                        disabled={submitting}
                    />
                    <input
                        type="text"
                        placeholder="Client (optional)"
                        value={client}
                        onChange={(e) => setClient(e.target.value)}
                        disabled={submitting}
                    />
                    <div className="new-project-actions">
                        <button type="submit" disabled={!title.trim() || submitting}>
                            {submitting ? 'Creating…' : 'Create'}
                        </button>
                        <button type="button" onClick={handleCancel} disabled={submitting}>
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            <ul className="project-list">
                {projects.map((p) => (
                    <li key={p.id} className={p.id === activeProjectId ? 'active' : ''}>
                        <Link to={ROUTES.commissionsProject(p.id)}>
                            <span className="project-title">{p.title}</span>
                            <span className="project-client">{p.client}</span>
                        </Link>
                    </li>
                ))}
                {projects.length === 0 && !creating && (
                    <li className="empty-hint">No projects yet. Click + to add one.</li>
                )}
            </ul>
        </aside>
    )
}
