import { Navigate, Route, Routes, useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { NotesSidebar } from '../components/notes/NotesSidebar'
import { NoteEditor } from '../components/notes/NoteEditor'
import { SynapsesMascot } from '../components/common/SynapsesMascot'

const easeOut = [0.16, 1, 0.3, 1] as const

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.06 }
    }
}

const columnVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 280, damping: 28 }
    }
} as const

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
            <div
                className="project-empty-icon-wrap"
                style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
            >
                <SynapsesMascot size={80} animated={true} />
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
        <div className="notes-container">
            <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: easeOut }}
                className="dashboard-ribbon"
            >
                <div className="ribbon-greeting">
                    <h1>Notes</h1>
                    <p>Capture ideas, drafts, and references.</p>
                </div>
            </motion.div>

            <motion.div
                className="notes-layout"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={columnVariants} style={{ display: 'flex' }}>
                    <NotesSidebar />
                </motion.div>

                <motion.div variants={columnVariants} className="notes-main-area">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            transition={{ duration: 0.22, ease: easeOut }}
                            className="notes-content-wrapper"
                        >
                            <Routes location={location}>
                                <Route index element={<EmptyState />} />
                                <Route path=":id" element={<NoteEditorRoute />} />
                            </Routes>
                        </motion.div>
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </div>
    )
}
