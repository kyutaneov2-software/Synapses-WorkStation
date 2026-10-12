import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pin, Trash2 } from 'lucide-react'
import type { Note } from '../../../../shared/types'
import { useProjects } from '../../lib/hooks'
import { TagInput } from '../common/TagInput'

interface NoteEditorProps {
    noteId: number
}

export function NoteEditor({ noteId }: NoteEditorProps): React.JSX.Element {
    const navigate = useNavigate()
    const { projects } = useProjects()

    const [note, setNote] = useState<Note | null>(null)
    const [loading, setLoading] = useState(true)

    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')
    const [topics, setTopics] = useState<string[]>([])
    const [projectId, setProjectId] = useState<number | null>(null)

    const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
    const [confirmingDelete, setConfirmingDelete] = useState(false)

    const loadedRef = useRef(false)
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const pendingRef = useRef<Partial<Note>>({})

    // ── Load the note once on mount / when id changes ────────
    useEffect(() => {
        let cancelled = false
        loadedRef.current = false

        window.api.getNote(noteId).then((n) => {
            if (cancelled) return
            setNote(n)
            setTitle(n.title)
            setBody(n.body)
            setTopics(n.topics ?? [])
            setProjectId(n.project_id)
            setLoading(false)
            // Mark loaded on next tick so the autosave effect skips the initial set
            setTimeout(() => {
                if (!cancelled) loadedRef.current = true
            }, 0)
        })

        return () => {
            cancelled = true
        }
    }, [noteId])

    // ── Autosave ─────────────────────────────────────────────
    useEffect(() => {
        if (!loadedRef.current) return

        const patch: Partial<Note> = {}
        if (title !== note?.title) patch.title = title
        if (body !== note?.body) patch.body = body
        if (projectId !== note?.project_id) patch.project_id = projectId
        const currentTopics = topics.length > 0 ? topics : null
        const noteTopics = note?.topics ?? null
        if (JSON.stringify(currentTopics) !== JSON.stringify(noteTopics)) {
            patch.topics = currentTopics as Note['topics']
        }

        if (Object.keys(patch).length === 0) return

        pendingRef.current = patch

        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(async () => {
            setSaveState('saving') // ← moved inside timer
            const toSave = pendingRef.current
            pendingRef.current = {}
            const updated = await window.api.updateNote(noteId, toSave)
            setNote(updated)
            setSaveState('saved')
            setTimeout(() => setSaveState('idle'), 1200)
        }, 500)

        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        }
    }, [title, body, topics, projectId, note, noteId])

    // ── Flush pending save on unmount ────────────────────────
    useEffect(() => {
        return () => {
            if (Object.keys(pendingRef.current).length > 0) {
                window.api.updateNote(noteId, pendingRef.current)
            }
        }
    }, [noteId])

    const handleTogglePin = async (): Promise<void> => {
        if (!note) return
        const updated = await window.api.updateNote(noteId, { pinned: note.pinned ? 0 : 1 })
        setNote(updated)
    }

    const handleDelete = async (): Promise<void> => {
        if (!confirmingDelete) {
            setConfirmingDelete(true)
            setTimeout(() => setConfirmingDelete(false), 3000)
            return
        }
        await window.api.deleteNote(noteId)
        navigate('/notes')
    }

    if (loading) {
        return (
            <div className="note-editor">
                <p style={{ color: 'var(--text-3)' }}>Loading…</p>
            </div>
        )
    }

    if (!note) {
        return (
            <div className="note-editor">
                <p style={{ color: 'var(--text-3)' }}>Note not found.</p>
            </div>
        )
    }

    return (
        <div className="note-editor">
            <div className="note-editor-header">
                <input
                    type="text"
                    className="note-editor-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Untitled"
                />
                <span className={`note-save-status ${saveState === 'saving' ? 'saving' : ''}`}>
                    {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : ''}
                </span>
            </div>

            <textarea
                className="note-editor-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Start writing…"
            />

            <div className="note-editor-footer">
                <TagInput value={topics} onChange={setTopics} placeholder="Add a topic…" />

                <select
                    className="note-project-select"
                    value={projectId === null ? 'none' : String(projectId)}
                    onChange={(e) =>
                        setProjectId(e.target.value === 'none' ? null : Number(e.target.value))
                    }
                    title="Attach to project"
                >
                    <option value="none">No project</option>
                    {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.title}
                        </option>
                    ))}
                </select>

                <div className="note-editor-actions">
                    {confirmingDelete && (
                        <span className="note-delete-confirm">Click again to delete</span>
                    )}
                    <button
                        className={`note-icon-btn ${note.pinned ? 'active' : ''}`}
                        onClick={handleTogglePin}
                        title={note.pinned ? 'Unpin' : 'Pin'}
                        aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
                    >
                        <Pin size={14} strokeWidth={2} />
                    </button>
                    <button
                        className="note-icon-btn danger"
                        onClick={handleDelete}
                        title="Delete note"
                        aria-label="Delete note"
                    >
                        <Trash2 size={14} strokeWidth={2} />
                    </button>
                </div>
            </div>
        </div>
    )
}
