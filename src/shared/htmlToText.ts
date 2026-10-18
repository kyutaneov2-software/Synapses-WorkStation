const ENTITIES: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'"
}

/**
 * Note HTML -> plain text, for previews and search.
 * Copes with HTML that was cut off mid-tag (previews are truncated),
 * and old plain-text notes pass through untouched.
 */
export function htmlToText(html: string): string {
    return html
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<\/(div|p|h[1-6]|li)>/gi, ' ')
        .replace(/<\/?[a-z][^>]*>?/gi, '')
        .replace(/&(?:nbsp|amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m] ?? m)
        .replace(/\s+/g, ' ')
        .trim()
}
