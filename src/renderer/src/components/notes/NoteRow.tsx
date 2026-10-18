import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
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

// Create a motion-enabled NavLink
const MotionNavLink = motion.create(NavLink)

export function NoteRow({ note }: NoteRowProps): React.JSX.Element {
    const preview = htmlToText(note.preview)

    return (
        <MotionNavLink
            layout
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            to={`/notes/${note.id}`}
            className={({ isActive }: { isActive: boolean }) =>
                `note-item ${isActive ? 'active' : ''}`
            }
        >
            <div className="note-item-title">{note.title || 'Untitled'}</div>
            {preview && <div className="note-item-preview">{preview}</div>}
            <div className="note-item-meta">{relativeTime(note.updated_at)}</div>
        </MotionNavLink>
    )
}
