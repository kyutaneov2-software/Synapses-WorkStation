import { useEffect, useRef } from 'react'
import { handleChecklistEnter } from '../../lib/checkList'

interface NoteBodyEditorProps {
    initialHtml: string
    onChange: (html: string) => void
    editorRef: React.RefObject<HTMLDivElement | null>
}

export function NoteBodyEditor({
    initialHtml,
    onChange,
    editorRef
}: NoteBodyEditorProps): React.JSX.Element {
    const hydratedRef = useRef(false)

    useEffect(() => {
        if (hydratedRef.current || !editorRef.current) return
        editorRef.current.innerHTML = initialHtml
        // New lines become <div>s everywhere, so headings and lists behave the same on every line.
        document.execCommand('defaultParagraphSeparator', false, 'div')
        hydratedRef.current = true
    }, [initialHtml, editorRef])

    const emit = (): void => {
        if (!hydratedRef.current || !editorRef.current) return
        onChange(editorRef.current.innerHTML)
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>): void => {
        e.preventDefault()
        document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
        // Enter on a checklist line keeps the list going (or ends it on an empty line).
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && editorRef.current) {
            if (handleChecklistEnter(editorRef.current)) {
                e.preventDefault()
                emit()
                return
            }
        }

        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
        const cmdKey = isMac ? e.metaKey : e.ctrlKey

        if (cmdKey) {
            if (e.key.toLowerCase() === 'b') {
                e.preventDefault()
                document.execCommand('bold')
                emit()
            } else if (e.key.toLowerCase() === 'i') {
                e.preventDefault()
                document.execCommand('italic')
                emit()
            }
        }
    }

    const handleClick = (e: React.MouseEvent<HTMLDivElement>): void => {
        const target = e.target as HTMLElement

        // Links open in the external browser (main/index.ts -> shell.openExternal)
        const link = target.closest('a')
        if (link) {
            e.preventDefault()
            const href = link.getAttribute('href')
            if (href) window.open(href, '_blank')
            return
        }

        // A ticked box only changes the checked *property*, which innerHTML doesn't contain.
        // Mirror it into the attribute so the state is actually saved.
        if (target instanceof HTMLInputElement && target.type === 'checkbox') {
            target.toggleAttribute('checked', target.checked)
            emit()
        }
    }

    return (
        <div
            ref={editorRef}
            className="note-editor-body"
            contentEditable
            onInput={emit}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            onClick={handleClick}
            data-placeholder="Start writing…"
        />
    )
}
