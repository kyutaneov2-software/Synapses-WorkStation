// Only these tags survive. Everything else is unwrapped (children kept),
// which also removes the <font> / <span style> junk execCommand leaves behind.
const KEEP_TAGS = new Set([
    'B',
    'STRONG',
    'I',
    'EM',
    'U',
    'H1',
    'H2',
    'H3',
    'UL',
    'OL',
    'LI',
    'A',
    'BR',
    'DIV',
    'P'
])

// These are removed together with their content.
const DROP_TAGS = new Set([
    'SCRIPT',
    'STYLE',
    'IFRAME',
    'OBJECT',
    'EMBED',
    'LINK',
    'META',
    'SVG',
    'MATH'
])

function isSafeHref(href: string): boolean {
    return /^(https?:|mailto:)/i.test(href.trim())
}

function cleanChildren(parent: Element): void {
    for (const child of Array.from(parent.children)) {
        const tag = child.tagName.toUpperCase()

        if (DROP_TAGS.has(tag)) {
            child.remove()
            continue
        }

        cleanChildren(child)

        if (!KEEP_TAGS.has(tag)) {
            child.replaceWith(...Array.from(child.childNodes))
            continue
        }

        for (const attr of Array.from(child.attributes)) {
            const keep = tag === 'A' && attr.name === 'href' && isSafeHref(attr.value)
            if (!keep) child.removeAttribute(attr.name)
        }
        if (tag === 'A') child.setAttribute('rel', 'noopener noreferrer')
    }
}

/** Whitelist-sanitize note HTML. DOMParser output is inert, so nothing runs while parsing. */
export function sanitizeHtml(html: string): string {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    cleanChildren(doc.body)
    return doc.body.innerHTML
}
