import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useProjects } from '../../lib/hooks'
import { ROUTES } from '../../lib/routes'
import { projectTypeIcon } from '../../lib/projectIcons'

export function Sidebar(): React.JSX.Element {
    const { projects } = useProjects()
    const navigate = useNavigate()
    const location = useLocation()

    const [creating, setCreating] = useState(false)
    const [title, setTitle] = useState('')
    const [client, setClient] = useState('')
    const [submitting, setSubmitting] = useState(false)

    // Matches /projects/123
    const match = location.pathname.match(/^\/projects\/(\d+)/)
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
            navigate(ROUTES.projectDetail(project.id))
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

            <AnimatePresence initial={false}>
                {creating && (
                    <motion.form
                        initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
                        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        transition={{ duration: 0.2 }}
                        className="new-project-form"
                        onSubmit={handleSubmit}
                    >
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
                    </motion.form>
                )}
            </AnimatePresence>

            <ul className="project-list">
                <AnimatePresence mode="popLayout">
                    {projects.map((p) => (
                        <motion.li
                            layout
                            key={p.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            whileHover={{ x: 4 }}
                            transition={{ duration: 0.15 }}
                            className={p.id === activeProjectId ? 'active' : ''}
                        >
                            <Link to={ROUTES.projectDetail(p.id)}>
                                <span className="project-title-row">
                                    {projectTypeIcon(p.type, 13)}
                                    <span className="project-title">{p.title}</span>
                                </span>
                                <span className="project-client">{p.client}</span>
                            </Link>
                        </motion.li>
                    ))}
                </AnimatePresence>
                {projects.length === 0 && !creating && (
                    <motion.li
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="empty-hint"
                    >
                        No projects yet. Click + to add one.
                    </motion.li>
                )}
            </ul>
        </aside>
    )
}
