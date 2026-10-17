import { useMemo, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Pin, Plus } from 'lucide-react'
import { useNotes } from '../../lib/hooks'
import { parseSqliteMs } from '../../lib/dates'

interface NotesSidebarProps {
    projectId?: number | null
}

export function NotesSidebar({ projectId }: NotesSidebarProps): React.JSX.Element {
    const { notes } = useNotes()
    const navigate = useNavigate()
    const [search, setSearch] = useState('')

    const filtered = useMemo(() => {
        let list = notes
        if (projectId !== undefined) {
            list = list.filter((n) => n.project_id === projectId)
        }
        const q = search.trim().toLowerCase()
        if (q) {
            list = list.filter(
                (n) => n.title.toLowerCase().includes(q) || n.preview.toLowerCase().includes(q)
            )
        }
        return list
    }, [notes, search, projectId])

    const pinned = filtered.filter((n) => n.pinned)
    const rest = filtered.filter((n) => !n.pinned)

    const handleNew = async (): Promise<void> => {
        const note = await window.api.createNote('Untitled', projectId ?? null)
        navigate(`/notes/${note.id}`)
    }

    return (
        <aside className="notes-sidebar">
            <div className="notes-sidebar-header">
                <input
                    type="text"
                    className="notes-search"
                    placeholder="Search notes…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <button
                    className="notes-new-btn"
                    onClick={handleNew}
                    title="New note"
                    aria-label="New note"
                >
                    <Plus size={16} strokeWidth={2.5} />
                </button>
            </div>

            <div className="notes-list">
                {filtered.length === 0 && (
                    <div className="notes-empty-list">
                        {search ? 'No notes match.' : 'No notes yet.'}
                    </div>
                )}

                {pinned.length > 0 && (
                    <>
                        <div className="notes-group-label">Pinned</div>
                        {pinned.map((n) => (
                            <NoteRow key={n.id} note={n} />
                        ))}
                    </>
                )}

                {rest.length > 0 && (
                    <>
                        {pinned.length > 0 && <div className="notes-group-label">All notes</div>}
                        {rest.map((n) => (
                            <NoteRow key={n.id} note={n} />
                        ))}
                    </>
                )}
            </div>
        </aside>
    )
}

interface NoteRowProps {
    note: {
        id: number
        title: string
        preview: string
        pinned: number
        updated_at: string
    }
}

function NoteRow({ note }: NoteRowProps): React.JSX.Element {
    return (
        <NavLink
            to={`/notes/${note.id}`}
            className={({ isActive }) => `note-item ${isActive ? 'active' : ''}`}
        >
            <div className="note-item-title">
                {note.pinned === 1 && <Pin size={11} strokeWidth={2.5} />}
                <span>{note.title || 'Untitled'}</span>
            </div>
            {note.preview && <div className="note-item-preview">{note.preview}</div>}
            <div className="note-item-meta">{relativeTime(note.updated_at)}</div>
        </NavLink>
    )
}

function relativeTime(sqliteTs: string): string {
    const then = parseSqliteMs(sqliteTs)
    const diff = Date.now() - then
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return new Date(then).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
