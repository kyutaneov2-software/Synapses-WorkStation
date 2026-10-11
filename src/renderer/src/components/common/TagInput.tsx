import { useRef, useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'

interface TagInputProps {
    value: string[]
    onChange: (tags: string[]) => void
    suggestions?: string[]
    placeholder?: string
}

export function TagInput({
    value,
    onChange,
    suggestions = [],
    placeholder = 'Add a tag…'
}: TagInputProps): React.JSX.Element {
    const [draft, setDraft] = useState('')
    const [focused, setFocused] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const addTag = (raw: string): void => {
        const name = raw.trim().replace(/^#/, '').slice(0, 50)
        if (!name || value.includes(name)) {
            setDraft('')
            return
        }
        onChange([...value, name].slice(0, 20))
        setDraft('')
    }

    const removeTag = (name: string): void => {
        onChange(value.filter((t) => t !== name))
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addTag(draft)
        } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
            removeTag(value[value.length - 1])
        } else if (e.key === 'Escape') {
            setDraft('')
            inputRef.current?.blur()
        }
    }

    const filteredSuggestions = focused
        ? suggestions
              .filter((s) => !value.includes(s))
              .filter((s) => s.toLowerCase().includes(draft.toLowerCase()))
              .slice(0, 6)
        : []

    return (
        <div className="tag-input-wrap">
            <div
                className={`tag-input ${focused ? 'focused' : ''}`}
                onClick={() => inputRef.current?.focus()}
            >
                {value.map((tag) => (
                    <span key={tag} className="tag-chip">
                        {tag}
                        <button
                            type="button"
                            className="tag-chip-x"
                            onClick={(e) => {
                                e.stopPropagation()
                                removeTag(tag)
                            }}
                            aria-label={`Remove ${tag}`}
                        >
                            <X size={10} strokeWidth={2.5} />
                        </button>
                    </span>
                ))}
                <input
                    ref={inputRef}
                    type="text"
                    className="tag-input-field"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setTimeout(() => setFocused(false), 120)}
                    placeholder={value.length === 0 ? placeholder : ''}
                />
            </div>

            {filteredSuggestions.length > 0 && (
                <div className="tag-suggestions">
                    {filteredSuggestions.map((s) => (
                        <button
                            key={s}
                            type="button"
                            className="tag-suggestion"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => addTag(s)}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
