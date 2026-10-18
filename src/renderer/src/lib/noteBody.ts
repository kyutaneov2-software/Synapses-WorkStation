import { sanitizeHtml } from './sanitizeHtml'

const LOOKS_LIKE_HTML = /<\/?[a-z][^>]*>/i

function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Stored body (old plain text or new HTML) -> safe HTML to put in the editor. */
export function bodyToEditorHtml(body: string): string {
    if (LOOKS_LIKE_HTML.test(body)) return sanitizeHtml(body)
    return escapeHtml(body).replace(/\n/g, '<br>')
}

/** Editor HTML -> what gets stored. An emptied editor leaves a lone <br>; store '' instead. */
export function editorHtmlToBody(html: string): string {
    const clean = sanitizeHtml(html)
    return clean === '<br>' ? '' : clean
}
