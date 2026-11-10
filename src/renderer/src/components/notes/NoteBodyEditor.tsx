import { useEffect, useRef } from 'react'
import { handleChecklistEnter } from '../../lib/checkList'

interface NoteBodyEditorProps {
    initialHtml: string
    onChange: (html: string) => void
    editorRef: React.RefObject<HTMLDivElement | null>
}

/**
 * Splits a parent element into sibling <div>s wherever a <br><br> pair
 * appears. This converts the "blank line via two breaks" pattern (which
 * rich-text editors emit) into proper paragraph divs that our sanitizer
 * and contentEditable both handle cleanly on round-trip.
 */
function convertDoubleBreaks(doc: Document): void {
    let iterations = 0
    const MAX_ITERATIONS = 1000

    while (iterations++ < MAX_ITERATIONS) {
        const brs = Array.from(doc.body.querySelectorAll('br'))
        let found = false

        for (let i = 0; i < brs.length - 1; i++) {
            const first = brs[i]
            const second = brs[i + 1]
            if (!first.isConnected || !second.isConnected) continue
            if (first.parentNode !== second.parentNode) continue

            // Confirm nothing meaningful sits between them
            let between: Node | null = first.nextSibling
            while (between && between !== second) {
                if (between.nodeType === Node.TEXT_NODE && !between.textContent?.trim()) {
                    between = between.nextSibling
                    continue
                }
                between = null
                break
            }
            if (between !== second) continue

            const parent = first.parentNode
            if (!parent) continue

            // Move everything after the second <br> into a new sibling div
            const newDiv = doc.createElement('div')
            let curr = second.nextSibling
            while (curr) {
                const next = curr.nextSibling
                newDiv.appendChild(curr)
                curr = next
            }
            if (newDiv.childNodes.length === 0) {
                newDiv.appendChild(doc.createElement('br'))
            }

            first.remove()
            second.remove()

            if (parent === doc.body) {
                parent.appendChild(newDiv)
            } else {
                parent.parentNode?.insertBefore(newDiv, parent.nextSibling)
            }

            found = true
            break
        }

        if (!found) break
    }
}

/**
 * Wraps body-level bare content (loose text nodes, bare inline tags)
 * in a <div> so convertDoubleBreaks always has a block parent to
 * operate on. Most pastes arrive with this already wrapped, but email
 * clients and some rich-text sources leak bare content.
 */
function wrapBodyContent(doc: Document): void {
    const body = doc.body
    const children = Array.from(body.childNodes)
    if (children.length === 0) return

    const hasBareContent = children.some((n) => {
        if (n.nodeType === Node.TEXT_NODE && n.textContent?.trim()) return true
        if (n.nodeType === Node.ELEMENT_NODE) {
            const tag = (n as Element).tagName
            const isBlock = ['DIV', 'P', 'UL', 'OL', 'LI', 'H1', 'H2', 'H3', 'TABLE'].includes(tag)
            if (!isBlock) return true
        }
        return false
    })

    if (!hasBareContent) return

    const wrapper = doc.createElement('div')
    while (body.firstChild) {
        wrapper.appendChild(body.firstChild)
    }
    body.appendChild(wrapper)
}

function cleanPastedHtml(rawHtml: string): string {
    // Pre-pass: collapse runs of 3+ <br> down to exactly two
    const html = rawHtml.replace(/(?:<br\s*\/?>\s*){3,}/gi, '<br><br>')

    const doc = new DOMParser().parseFromString(html, 'text/html')
    const body = doc.body

    // Drop dangerous elements entirely
    body.querySelectorAll('script, style, meta, link, iframe, object, embed').forEach((el) => {
        el.remove()
    })

    wrapBodyContent(doc)
    convertDoubleBreaks(doc)

    return body.innerHTML
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
        document.execCommand('defaultParagraphSeparator', false, 'div')
        hydratedRef.current = true
    }, [initialHtml, editorRef])

    const emit = (): void => {
        if (!hydratedRef.current || !editorRef.current) return
        onChange(editorRef.current.innerHTML)
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>): void => {
        e.preventDefault()

        const html = e.clipboardData.getData('text/html')
        const text = e.clipboardData.getData('text/plain')

        // Prefer HTML when available — preserves rich structure AND
        // avoids the literal-<br> bug where plain text from rich sources
        // gets inserted as visible tag characters.
        if (html && html.trim()) {
            const clean = cleanPastedHtml(html)
            document.execCommand('insertHTML', false, clean)
            emit()
            return
        }

        // Plain text only — insert as-is. If the user copies from a code
        // block that contains literal <br> text, they intend to keep it.
        if (text) {
            document.execCommand('insertText', false, text)
            emit()
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
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

        const link = target.closest('a')
        if (link) {
            e.preventDefault()
            const href = link.getAttribute('href')
            if (href) window.open(href, '_blank')
            return
        }

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
