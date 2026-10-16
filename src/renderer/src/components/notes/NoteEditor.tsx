import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pin, Trash2 } from 'lucide-react'
import type { Note } from '../../../../shared/types'
import { useProjects } from '../../lib/hooks'
import { TagInput } from '../common/TagInput'

interface NoteEditorProps {
    noteId: number
}

const SAVE_DEBOUNCE_MS = 500
const SAVED_INDICATOR_MS = 1200
const DELETE_CONFIRM_MS = 3000

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

    // Unmount guard — every setState after an `await` must check this.
    const aliveRef = useRef(true)
    // Last-confirmed DB state. Diff base for autosave.
    const noteRef = useRef<Note | null>(null)
    // Debounce timer for the autosave.
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    // Separate timer for the "Saved" indicator so it never fights the debounce.
    const indicatorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    // Accumulated patch built fresh on every effect run.
    const pendingRef = useRef<Partial<Note>>({})

    // ── Lifecycle: unmount guard ────────────────────────────
    useEffect(() => {
        aliveRef.current = true
        return () => {
            aliveRef.current = false
        }
    }, [])

    // ── Load ────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false

        window.api
            .getNote(noteId)
            .then((n) => {
                if (cancelled) return
                noteRef.current = n
                setNote(n)
                setTitle(n.title)
                setBody(n.body)
                setTopics(n.topics ?? [])
                setProjectId(n.project_id)
                setLoading(false)
            })
            .catch((e) => {
                if (cancelled) return
                console.error('[NoteEditor] load failed:', e)
                setNote(null)
                setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [noteId])

    // ── Save flush ──────────────────────────────────────────
    const flushSave = useCallback(async (): Promise<void> => {
        const toSave = pendingRef.current
        pendingRef.current = {}
        if (Object.keys(toSave).length === 0) return
        if (!aliveRef.current) return

        setSaveState('saving')

        try {
            const updated = await window.api.updateNote(noteId, toSave)
            if (!aliveRef.current) return

            noteRef.current = updated
            setNote(updated)
            setSaveState('saved')

            if (indicatorTimerRef.current) clearTimeout(indicatorTimerRef.current)
            indicatorTimerRef.current = setTimeout(() => {
                if (aliveRef.current) setSaveState('idle')
            }, SAVED_INDICATOR_MS)
        } catch (e) {
            if (!aliveRef.current) return
            console.error('[NoteEditor] save failed:', e)
            // Re-queue so the next edit or unmount retries.
            pendingRef.current = { ...toSave, ...pendingRef.current }
            setSaveState('idle')
        }
    }, [noteId])

    // ── Autosave ────────────────────────────────────────────
    // Note: `note` is intentionally NOT in deps. We diff against
    // `noteRef.current` so the effect doesn't re-run when a save resolves.
    useEffect(() => {
        const base = noteRef.current
        if (!base) return

        const patch: Partial<Note> = {}
        if (title !== base.title) patch.title = title
        if (body !== base.body) patch.body = body
        if (projectId !== base.project_id) patch.project_id = projectId
        const currentTopics = topics.length > 0 ? topics : null
        const baseTopics = base.topics ?? null
        if (JSON.stringify(currentTopics) !== JSON.stringify(baseTopics)) {
            patch.topics = currentTopics as Note['topics']
        }

        if (Object.keys(patch).length === 0) return

        pendingRef.current = patch

        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(() => {
            void flushSave()
        }, SAVE_DEBOUNCE_MS)

        return () => {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current)
                saveTimerRef.current = null
            }
        }
    }, [title, body, topics, projectId, flushSave])

    // ── Unmount flush ───────────────────────────────────────
    useEffect(() => {
        return () => {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current)
                saveTimerRef.current = null
            }
            if (indicatorTimerRef.current) {
                clearTimeout(indicatorTimerRef.current)
                indicatorTimerRef.current = null
            }
            const leftover = pendingRef.current
            pendingRef.current = {}
            if (Object.keys(leftover).length > 0) {
                // Fire-and-forget. Component is unmounting, no setState.
                window.api.updateNote(noteId, leftover).catch((e) => {
                    console.error('[NoteEditor] unmount flush failed:', e)
                })
            }
        }
    }, [noteId])

    // ── Actions ─────────────────────────────────────────────
    const handleTogglePin = async (): Promise<void> => {
        if (!note) return
        try {
            const updated = await window.api.updateNote(noteId, { pinned: note.pinned ? 0 : 1 })
            if (!aliveRef.current) return
            noteRef.current = updated
            setNote(updated)
        } catch (e) {
            console.error('[NoteEditor] toggle pin failed:', e)
        }
    }

    const handleDelete = async (): Promise<void> => {
        if (!confirmingDelete) {
            setConfirmingDelete(true)
            setTimeout(() => setConfirmingDelete(false), DELETE_CONFIRM_MS)
            return
        }
        try {
            await window.api.deleteNote(noteId)
            if (aliveRef.current) navigate('/notes')
        } catch (e) {
            console.error('[NoteEditor] delete failed:', e)
        }
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
