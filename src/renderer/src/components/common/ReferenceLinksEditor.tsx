import { useState } from 'react'
import { X, Plus, ExternalLink } from 'lucide-react'
import type { ReferenceLink } from '../../../../shared/types'

interface ReferenceLinksEditorProps {
    value: ReferenceLink[]
    onChange: (links: ReferenceLink[]) => void
}

export function ReferenceLinksEditor({
    value,
    onChange
}: ReferenceLinksEditorProps): React.JSX.Element {
    const [adding, setAdding] = useState(false)
    const [label, setLabel] = useState('')
    const [url, setUrl] = useState('')

    const commit = (): void => {
        const l = label.trim().slice(0, 100) || 'Link'
        let u = url.trim().slice(0, 500)
        if (!u) return
        if (!/^[a-z]+:\/\//i.test(u)) u = `https://${u}`
        onChange([...value, { label: l, url: u }].slice(0, 20))
        setLabel('')
        setUrl('')
        setAdding(false)
    }

    const remove = (i: number): void => {
        onChange(value.filter((_, idx) => idx !== i))
    }

    const openExternal = (u: string): void => {
        window.open(u, '_blank', 'noopener,noreferrer')
    }

    return (
        <div className="ref-links">
            {value.map((link, i) => (
                <div key={i} className="ref-link-row">
                    <span className="ref-link-label">{link.label}</span>
                    <a
                        className="ref-link-url"
                        href={link.url}
                        onClick={(e) => {
                            e.preventDefault()
                            openExternal(link.url)
                        }}
                    >
                        {link.url}
                        <ExternalLink size={11} strokeWidth={2} />
                    </a>
                    <button
                        type="button"
                        className="ref-link-remove"
                        onClick={() => remove(i)}
                        title="Remove link"
                    >
                        <X size={13} strokeWidth={2.5} />
                    </button>
                </div>
            ))}

            {adding ? (
                <div className="ref-link-form">
                    <input
                        type="text"
                        placeholder="Label (e.g. Figma)"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        autoFocus
                    />
                    <input
                        type="text"
                        placeholder="https://…"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') commit()
                            if (e.key === 'Escape') {
                                setAdding(false)
                                setLabel('')
                                setUrl('')
                            }
                        }}
                    />
                    <button type="button" onClick={commit}>
                        Add
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setAdding(false)
                            setLabel('')
                            setUrl('')
                        }}
                    >
                        Cancel
                    </button>
                </div>
            ) : (
                <button type="button" className="ref-link-add" onClick={() => setAdding(true)}>
                    <Plus size={13} strokeWidth={2} />
                    Add reference link
                </button>
            )}
        </div>
    )
}
