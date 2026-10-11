import { useRef, useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { TECH_STACK_PRESETS } from '../../../../shared/constants'

interface TechStackPickerProps {
    value: string[]
    onChange: (stack: string[]) => void
}

export function TechStackPicker({ value, onChange }: TechStackPickerProps): React.JSX.Element {
    const [showCustom, setShowCustom] = useState(false)
    const [draft, setDraft] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    const toggle = (name: string): void => {
        if (value.includes(name)) {
            onChange(value.filter((v) => v !== name))
        } else {
            onChange([...value, name].slice(0, 30))
        }
    }

    const addCustom = (): void => {
        const name = draft.trim().slice(0, 60)
        if (!name) {
            setShowCustom(false)
            return
        }
        if (!value.includes(name)) {
            onChange([...value, name].slice(0, 30))
        }
        setDraft('')
        setTimeout(() => inputRef.current?.focus(), 20)
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter') {
            e.preventDefault()
            addCustom()
        } else if (e.key === 'Escape') {
            setShowCustom(false)
            setDraft('')
        }
    }

    const presets = TECH_STACK_PRESETS as readonly string[]
    const customs = value.filter((v) => !presets.includes(v))

    return (
        <div className="tech-stack">
            <div className="tech-stack-presets">
                {TECH_STACK_PRESETS.map((preset) => {
                    const selected = value.includes(preset)
                    return (
                        <button
                            key={preset}
                            type="button"
                            className={`tech-chip ${selected ? 'selected' : ''}`}
                            onClick={() => toggle(preset)}
                        >
                            {preset}
                        </button>
                    )
                })}
            </div>

            {customs.length > 0 && (
                <div className="tech-stack-customs">
                    {customs.map((c) => (
                        <span key={c} className="tag-chip">
                            {c}
                            <button
                                type="button"
                                className="tag-chip-x"
                                onClick={() => onChange(value.filter((v) => v !== c))}
                                aria-label={`Remove ${c}`}
                            >
                                <X size={10} strokeWidth={2.5} />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {showCustom ? (
                <div className="tech-stack-custom-input">
                    <input
                        ref={inputRef}
                        type="text"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={() => {
                            if (!draft.trim()) setShowCustom(false)
                        }}
                        placeholder="Custom tech…"
                        autoFocus
                    />
                    <button type="button" onClick={addCustom}>
                        Add
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setShowCustom(false)
                            setDraft('')
                        }}
                    >
                        Done
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    className="tech-stack-add-custom"
                    onClick={() => setShowCustom(true)}
                >
                    + custom
                </button>
            )}
        </div>
    )
}
