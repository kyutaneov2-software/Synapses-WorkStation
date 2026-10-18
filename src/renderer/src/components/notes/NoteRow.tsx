import { NavLink } from 'react-router-dom'
import { htmlToText } from '../../../../shared/htmlToText'
import { relativeTime } from '../../lib/relativeTime'

interface NoteRowProps {
    note: {
        id: number
        title: string
        preview: string
        updated_at: string
    }
}

export function NoteRow({ note }: NoteRowProps): React.JSX.Element {
    const preview = htmlToText(note.preview)

    return (
        <NavLink
            to={`/notes/${note.id}`}
            className={({ isActive }) => `note-item ${isActive ? 'active' : ''}`}
        >
            <div className="note-item-title">{note.title || 'Untitled'}</div>
            {preview && <div className="note-item-preview">{preview}</div>}
            <div className="note-item-meta">{relativeTime(note.updated_at)}</div>
        </NavLink>
    )
}
