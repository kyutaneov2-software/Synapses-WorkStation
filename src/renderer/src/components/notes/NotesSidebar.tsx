import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { htmlToText } from '../../../../shared/htmlToText'
import { useNotes } from '../../lib/hooks'
import { NoteRow } from './NoteRow'

interface NotesSidebarProps {
    projectId?: number | null
}

export function NotesSidebar({ projectId }: NotesSidebarProps): React.JSX.Element {
    const { notes } = useNotes()
    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<'all' | 'pinned'>('all')

    const filtered = useMemo(() => {
        let list = notes
        if (projectId !== undefined) {
            list = list.filter((n) => n.project_id === projectId)
        }

        if (filter === 'pinned') {
            list = list.filter((n) => n.pinned)
        }

        const q = search.trim().toLowerCase()
        if (q) {
            // Search the readable text, not the HTML markup.
            list = list.filter(
                (n) =>
                    n.title.toLowerCase().includes(q) ||
                    htmlToText(n.preview).toLowerCase().includes(q)
            )
        }
        return list
    }, [notes, search, projectId, filter])

    const pinned = filtered.filter((n) => n.pinned)
    const rest = filtered.filter((n) => !n.pinned)

    const handleNew = async (): Promise<void> => {
        const note = await window.api.createNote('Untitled', projectId ?? null)
        navigate(`/notes/${note.id}`)
    }

    const totalCount = notes.length
    const pinnedCount = notes.filter((n) => n.pinned).length

    return (
        <aside className="notes-sidebar">
            <div className="notes-sidebar-header">
                <div className="notes-search-wrap">
                    <Search size={14} className="notes-search-icon" />
                    <input
                        type="text"
                        className="notes-search"
                        placeholder="Search notes"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button
                    className="notes-new-btn"
                    onClick={handleNew}
                    title="New note"
                    aria-label="New note"
                >
                    <Plus size={16} strokeWidth={2.5} />
                </button>
            </div>

            <div className="notes-filters">
                <button
                    className={`notes-filter-pill ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All <span className="pill-count">{totalCount}</span>
                </button>
                <button
                    className={`notes-filter-pill ${filter === 'pinned' ? 'active' : ''}`}
                    onClick={() => setFilter('pinned')}
                >
                    Pinned <span className="pill-count">{pinnedCount}</span>
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
                        <div className="notes-group-label">PINNED</div>
                        {pinned.map((n) => (
                            <NoteRow key={n.id} note={n} />
                        ))}
                    </>
                )}

                {rest.length > 0 && (
                    <>
                        {pinned.length > 0 && <div className="notes-group-label">ALL NOTES</div>}
                        {rest.map((n) => (
                            <NoteRow key={n.id} note={n} />
                        ))}
                    </>
                )}
            </div>
        </aside>
    )
}
