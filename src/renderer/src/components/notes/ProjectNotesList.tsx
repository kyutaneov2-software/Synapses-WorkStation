import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pin, Plus, StickyNote } from 'lucide-react'
import { useNotesByProject } from '../../lib/hooks'
import { parseSqliteDate } from '../../lib/dates'

interface ProjectNotesListProps {
    projectId: number
}

export function ProjectNotesList({ projectId }: ProjectNotesListProps): React.JSX.Element {
    const { notes } = useNotesByProject(projectId)
    const navigate = useNavigate()
    const [creating, setCreating] = useState(false)

    const handleNew = async (): Promise<void> => {
        if (creating) return
        setCreating(true)
        try {
            const note = await window.api.createNote('Untitled', projectId)
            navigate(`/notes/${note.id}`)
        } finally {
            setCreating(false)
        }
    }

    return (
        <div className="project-notes">
            <button className="project-notes-new" onClick={handleNew} disabled={creating}>
                <Plus size={14} strokeWidth={2.5} />
                {creating ? 'Creating…' : 'New note'}
            </button>

            {notes.length === 0 ? (
                <div className="empty-state">
                    <StickyNote size={28} strokeWidth={1.5} style={{ opacity: 0.4 }} />
                    <p>No notes for this project yet.</p>
                </div>
            ) : (
                <div className="project-notes-list">
                    {notes.map((n) => (
                        <button
                            key={n.id}
                            className="note-item"
                            onClick={() => navigate(`/notes/${n.id}`)}
                        >
                            <div className="note-item-title">
                                {n.pinned === 1 && <Pin size={11} strokeWidth={2.5} />}
                                <span>{n.title || 'Untitled'}</span>
                            </div>
                            {n.preview && <div className="note-item-preview">{n.preview}</div>}
                            <div className="note-item-meta">
                                {parseSqliteDate(n.updated_at).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
