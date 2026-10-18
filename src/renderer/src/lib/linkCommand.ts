const SAFE_URL = /^(https?:|mailto:)/i

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

/**
 * Link the selected text. With nothing selected, insert the URL itself as a link,
 * because execCommand('createLink') silently does nothing on a collapsed caret.
 */
export function applyLink(url: string): void {
    if (!SAFE_URL.test(url)) return
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return

    if (sel.isCollapsed) {
        const safe = escapeHtml(url)
        // The trailing nbsp keeps whatever you type next outside the link.
        document.execCommand('insertHTML', false, `<a href="${safe}">${safe}</a>&nbsp;`)
    } else {
        document.execCommand('createLink', false, url)
    }
}

/** Remove the link around the caret or selection. */
export function removeLink(): void {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return

    if (sel.isCollapsed) {
        const node = sel.anchorNode
        const el = node instanceof Element ? node : node?.parentElement
        const link = el?.closest('a')
        if (link) sel.selectAllChildren(link)
    }
    document.execCommand('unlink')
}
