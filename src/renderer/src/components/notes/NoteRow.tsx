import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { htmlToText } from '../../../../shared/htmlToText'
import { relativeTime } from '../../lib/relativeTime'

const easeOut = [0.16, 1, 0.3, 1] as const

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
            layout
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.18, ease: easeOut }}
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
