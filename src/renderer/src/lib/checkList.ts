/** The checklist line (a div that starts with a checkbox) the caret is in, if any. */
function checklistLine(editor: HTMLElement): HTMLElement | null {
    const node = window.getSelection()?.anchorNode
    // Changed Element to HTMLElement here
    let el = node instanceof HTMLElement ? node : (node?.parentElement ?? null)

    while (el && el !== editor) {
        if (el.matches('div') && el.firstElementChild?.matches('input[type="checkbox"]')) {
            return el
        }
        el = el.parentElement
    }
    return null
}

/** True when the caret sits after the line's checkbox (not in front of it). */
function caretAfterCheckbox(line: HTMLElement): boolean {
    const sel = window.getSelection()
    if (!sel || !sel.anchorNode) return false

    const before = document.createRange()
    before.setStart(line, 0)
    before.setEnd(sel.anchorNode, sel.anchorOffset)
    return before.cloneContents().querySelector('input[type="checkbox"]') !== null
}

/**
 * Enter inside a checklist line: start a new checkbox line, or leave the list
 * when the line is empty. Returns true if it handled the key.
 */
export function handleChecklistEnter(editor: HTMLElement): boolean {
    const line = checklistLine(editor)
    if (!line || !caretAfterCheckbox(line)) return false

    if ((line.textContent ?? '').trim() === '') {
        line.replaceChildren(document.createElement('br'))
        window.getSelection()?.collapse(line, 0)
        return true
    }

    document.execCommand('insertParagraph')
    document.execCommand('insertHTML', false, '<input type="checkbox"> ')
    return true
}
