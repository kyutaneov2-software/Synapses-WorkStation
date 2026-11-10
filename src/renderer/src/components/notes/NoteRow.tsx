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

const MotionNavLink = motion.create(NavLink)

export function NoteRow({ note }: NoteRowProps): React.JSX.Element {
    const preview = htmlToText(note.preview)

    return (
        <MotionNavLink
            layout="position" // <--- THE FIX: Only animate position, not size
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
            // Apple-esque spring: Snappy, minimal bounce, interruptible
            transition={{ type: 'spring', stiffness: 500, damping: 35, mass: 0.8 }}
            whileTap={{ scale: 0.98 }} // Press feedback
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
