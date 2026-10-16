import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { StickyNote } from 'lucide-react'
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
    return (
        <div className="note-editor-empty">
            <StickyNote size={32} strokeWidth={1.5} />
            <span>Select a note or create a new one.</span>
        </div>
    )
}

export function NotesSpace(): React.JSX.Element {
    return (
        <div className="space-layout">
            <NotesSidebar />
            <div className="main-area">
                <Routes>
                    <Route index element={<EmptyState />} />
                    <Route path=":id" element={<NoteEditorRoute />} />
                </Routes>
            </div>
        </div>
    )
}
