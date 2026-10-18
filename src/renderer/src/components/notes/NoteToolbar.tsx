import { useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
    Bold,
    CheckSquare,
    Heading,
    Italic,
    Link as LinkIcon,
    List,
    ListOrdered
} from 'lucide-react'
import type { ActiveFormats } from './UseFormatState'

interface ToolbarAction {
    title: string
    icon: LucideIcon
    command: string
    value?: string
    /** Which entry of ActiveFormats lights this button up. Omit for one-shot actions. */
    format?: keyof ActiveFormats
}

const GROUPS: ToolbarAction[][] = [
    [
        { title: 'Bold', icon: Bold, command: 'bold', format: 'bold' },
        { title: 'Italic', icon: Italic, command: 'italic', format: 'italic' },
        { title: 'Heading', icon: Heading, command: 'formatBlock', value: 'h2', format: 'heading' }
    ],
    [
        {
            title: 'Bullet list',
            icon: List,
            command: 'insertUnorderedList',
            format: 'bulletList'
        },
        {
            title: 'Numbered list',
            icon: ListOrdered,
            command: 'insertOrderedList',
            format: 'numberedList'
        },
        {
            title: 'Checklist',
            icon: CheckSquare,
            command: 'insertHTML',
            value: '<div><input type="checkbox" /> </div>'
        }
    ]
]

interface NoteToolbarProps {
    active: ActiveFormats
    onCommand: (command: string, value?: string) => void
}

export function NoteToolbar({ active, onCommand }: NoteToolbarProps): React.JSX.Element {
    const [linking, setLinking] = useState(false)
    const [url, setUrl] = useState('')
    const savedRange = useRef<Range | null>(null)

    // window.prompt() doesn't exist in Electron, so the link field lives in the toolbar.
    const startLink = (): void => {
        const sel = window.getSelection()
        savedRange.current = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null
        setUrl('')
        setLinking(true)
    }

    const finishLink = (submit: boolean): void => {
        const range = savedRange.current
        savedRange.current = null
        setLinking(false)

        const sel = window.getSelection()
        if (range && sel) {
            sel.removeAllRanges()
            sel.addRange(range)
        }

        const target = url.trim()
        if (submit && target) {
            onCommand('createLink', /^[a-z]+:/i.test(target) ? target : `https://${target}`)
        }
    }

    return (
        <div className="note-floating-toolbar">
            {linking ? (
                <input
                    autoFocus
                    className="note-link-input"
                    value={url}
                    placeholder="Paste a link, press Enter"
                    onChange={(e): void => setUrl(e.target.value)}
                    onKeyDown={(e): void => {
                        if (e.key === 'Enter') finishLink(true)
                        if (e.key === 'Escape') finishLink(false)
                    }}
                    onBlur={(): void => finishLink(false)}
                />
            ) : (
                <>
                    {GROUPS.map((group, i) => (
                        <div key={i} style={{ display: 'contents' }}>
                            {i > 0 && <span className="toolbar-divider" />}
                            {group.map(({ title, icon: Icon, command, value, format }) => (
                                <button
                                    key={title}
                                    title={title}
                                    className={format && active[format] ? 'active' : ''}
                                    aria-pressed={format ? active[format] : undefined}
                                    onMouseDown={(e): void => e.preventDefault()}
                                    onClick={(): void => onCommand(command, value)}
                                >
                                    <Icon size={14} />
                                </button>
                            ))}
                        </div>
                    ))}
                    <span className="toolbar-divider" />
                    {/* Lit = the caret is in a link, so clicking removes it. */}
                    <button
                        title={active.link ? 'Remove link' : 'Link'}
                        className={active.link ? 'active' : ''}
                        aria-pressed={active.link}
                        onMouseDown={(e): void => e.preventDefault()}
                        onClick={active.link ? (): void => onCommand('unlink') : startLink}
                    >
                        <LinkIcon size={14} />
                    </button>
                </>
            )}
        </div>
    )
}
