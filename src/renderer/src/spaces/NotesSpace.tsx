import { Navigate, Route, Routes, useParams, useNavigate, useLocation } from 'react-router-dom'
import { StickyNote } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { NotesSidebar } from '../components/notes/NotesSidebar'
import { NoteEditor } from '../components/notes/NoteEditor'

function NoteEditorRoute(): React.JSX.Element {
    const { id } = useParams<{ id: string }>()
    const noteId = Number(id)

    if (!id || !Number.isInteger(noteId) || noteId <= 0) {
        return <Navigate to="/notes" replace />
    }

    return <NoteEditor key={noteId} noteId={noteId} />
}

function EmptyState(): React.JSX.Element {
    const navigate = useNavigate()

    const handleNew = async (): Promise<void> => {
        const note = await window.api.createNote('Untitled', null)
        navigate(`/notes/${note.id}`)
    }

    return (
        <div className="note-editor-empty">
            <div className="note-empty-icon">
                <StickyNote size={32} strokeWidth={1.5} />
            </div>
            <h2>No note selected</h2>
            <p>Select a note from the sidebar or start a new one.</p>
            <button className="btn-primary" onClick={handleNew}>
                Create new note
            </button>
        </div>
    )
}

export function NotesSpace(): React.JSX.Element {
    const location = useLocation()

    return (
        <div className="space-layout">
            <NotesSidebar />
            <div className="main-area" style={{ overflow: 'hidden', position: 'relative' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                    >
                        <Routes location={location}>
                            <Route index element={<EmptyState />} />
                            <Route path=":id" element={<NoteEditorRoute />} />
                        </Routes>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}
