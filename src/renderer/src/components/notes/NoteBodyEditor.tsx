import { useEffect, useRef } from 'react'

interface NoteBodyEditorProps {
    /** Safe HTML for the first render. Only read once. */
    initialHtml: string
    /** Fires on real user input only (typing, formatting, paste). */
    onChange: (html: string) => void
    editorRef: React.RefObject<HTMLDivElement | null>
}

export function NoteBodyEditor({
    initialHtml,
    onChange,
    editorRef
}: NoteBodyEditorProps): React.JSX.Element {
    const hydratedRef = useRef(false)

    // Fill the editor exactly once. Re-filling after every save is what reset the
    // caret and ate keystrokes, so this must never depend on the saved note.
    useEffect(() => {
        if (hydratedRef.current || !editorRef.current) return
        editorRef.current.innerHTML = initialHtml
        hydratedRef.current = true
    }, [initialHtml, editorRef])

    const emit = (): void => {
        // Never report content before the real note has been put in the editor.
        if (!hydratedRef.current || !editorRef.current) return
        onChange(editorRef.current.innerHTML)
    }

    // Plain-text paste only: no foreign HTML, styles or scripts in your notes.
    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>): void => {
        e.preventDefault()
        document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
    }

    return (
        <div
            ref={editorRef}
            className="note-editor-body"
            contentEditable
            onInput={emit}
            onPaste={handlePaste}
            data-placeholder="Start writing…"
        />
    )
}
