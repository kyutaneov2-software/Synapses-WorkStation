import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pin, Trash2 } from 'lucide-react'
import type { Note } from '../../../../shared/types'
import { useProjects } from '../../lib/hooks'
import { applyLink, removeLink } from '../../lib/linkCommand'
import { bodyToEditorHtml, editorHtmlToBody } from '../../lib/noteBody'
import { relativeTime } from '../../lib/relativeTime'
import { TagInput } from '../common/TagInput'
import { NoteBodyEditor } from './NoteBodyEditor'
import { NoteToolbar } from './NoteToolbar'
import { useFormatState } from './useFormatState'
import { useNoteAutosave } from './useNoteAutosave'

interface NoteEditorProps {
    noteId: number
}

const DELETE_CONFIRM_MS = 3000

export function NoteEditor({ noteId }: NoteEditorProps): React.JSX.Element {
    const navigate = useNavigate()
    const { projects } = useProjects()
    const editorRef = useRef<HTMLDivElement>(null)
    const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const [note, setNote] = useState<Note | null>(null)
    const [initialHtml, setInitialHtml] = useState('')
    const [loading, setLoading] = useState(true)

    const [title, setTitle] = useState('')
    const [topics, setTopics] = useState<string[]>([])
    const [projectId, setProjectId] = useState<number | null>(null)
    const [confirmingDelete, setConfirmingDelete] = useState(false)

    const { saveState, queueSave, discard } = useNoteAutosave(noteId, setNote)
    const { active, refresh } = useFormatState(editorRef)

    useEffect(() => {
        let cancelled = false
        window.api
            .getNote(noteId)
            .then((n) => {
                if (cancelled) return
                setNote(n)
                setTitle(n.title)
                setTopics(n.topics ?? [])
                setProjectId(n.project_id)
                setInitialHtml(bodyToEditorHtml(n.body))
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

    useEffect(() => {
        return () => {
            if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current)
        }
    }, [])

    const handleTitle = (value: string): void => {
        setTitle(value)
        queueSave({ title: value })
    }

    const handleTopics = (value: string[]): void => {
        setTopics(value)
        queueSave({ topics: (value.length > 0 ? value : null) as Note['topics'] })
    }

    const handleProject = (value: number | null): void => {
        setProjectId(value)
        queueSave({ project_id: value })
    }

    const handleBody = (html: string): void => {
        queueSave({ body: editorHtmlToBody(html) })
    }

    const handleTogglePin = async (): Promise<void> => {
        if (!note) return
        try {
            setNote(await window.api.updateNote(noteId, { pinned: note.pinned ? 0 : 1 }))
        } catch (e) {
            console.error('[NoteEditor] toggle pin failed:', e)
        }
    }

    const handleDelete = async (): Promise<void> => {
        if (!confirmingDelete) {
            setConfirmingDelete(true)
            deleteTimerRef.current = setTimeout(() => setConfirmingDelete(false), DELETE_CONFIRM_MS)
            return
        }
        try {
            discard()
            await window.api.deleteNote(noteId)
            navigate('/notes')
        } catch (e) {
            console.error('[NoteEditor] delete failed:', e)
        }
    }

    const runCommand = (command: string, value?: string): void => {
        editorRef.current?.focus()

        if (command === 'createLink') {
            applyLink(value ?? '')
        } else if (command === 'unlink') {
            removeLink()
        } else if (command === 'bold' && active.heading) {
            return // headings are already bold
        } else if (command === 'formatBlock') {
            // Clicking Heading inside a heading turns it back into normal text.
            document.execCommand(command, false, active.heading ? 'div' : value)
        } else {
            document.execCommand(command, false, value)
        }

        refresh()
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

    const statusText =
        saveState === 'saving'
            ? 'Saving…'
            : saveState === 'saved'
              ? 'Saved'
              : `Saved · edited ${relativeTime(note.updated_at)}`

    return (
        <div className="note-editor">
            <div className="note-editor-content">
                <div className="note-editor-header">
                    <input
                        type="text"
                        className="note-editor-title"
                        value={title}
                        onChange={(e): void => handleTitle(e.target.value)}
                        placeholder="Untitled"
                    />
                    <div className="note-top-actions">
                        <span className="note-save-status">{statusText}</span>
                        <button
                            className={`note-icon-btn ${note.pinned ? 'active' : ''}`}
                            onClick={handleTogglePin}
                            title={note.pinned ? 'Unpin' : 'Pin'}
                        >
                            <Pin size={14} strokeWidth={2} />
                        </button>
                        <button
                            className={`note-icon-btn danger ${confirmingDelete ? 'confirming' : ''}`}
                            onClick={handleDelete}
                            title={confirmingDelete ? 'Click again to delete' : 'Delete note'}
                        >
                            <Trash2 size={14} strokeWidth={2} />
                        </button>
                    </div>
                </div>

                <div className="note-editor-meta">
                    <TagInput value={topics} onChange={handleTopics} placeholder="+ Add topic" />
                    <select
                        className="note-project-select"
                        value={projectId === null ? 'none' : String(projectId)}
                        onChange={(e): void =>
                            handleProject(e.target.value === 'none' ? null : Number(e.target.value))
                        }
                    >
                        <option value="none">No project</option>
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.title}
                            </option>
                        ))}
                    </select>
                </div>

                <NoteBodyEditor
                    initialHtml={initialHtml}
                    onChange={handleBody}
                    editorRef={editorRef}
                />
            </div>

            <NoteToolbar active={active} onCommand={runCommand} />
        </div>
    )
}
