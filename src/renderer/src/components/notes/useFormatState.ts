import { useCallback, useEffect, useState } from 'react'

export interface ActiveFormats {
    bold: boolean
    italic: boolean
    heading: boolean
    bulletList: boolean
    numberedList: boolean
    link: boolean
}

const NONE: ActiveFormats = {
    bold: false,
    italic: false,
    heading: false,
    bulletList: false,
    numberedList: false,
    link: false
}

function readFormats(): ActiveFormats {
    const anchor = window.getSelection()?.anchorNode
    const el = anchor instanceof Element ? anchor : anchor?.parentElement

    return {
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        heading: document.queryCommandValue('formatBlock').toLowerCase() === 'h2',
        bulletList: document.queryCommandState('insertUnorderedList'),
        numberedList: document.queryCommandState('insertOrderedList'),
        link: !!el?.closest('a')
    }
}

function isSame(a: ActiveFormats, b: ActiveFormats): boolean {
    return (Object.keys(a) as (keyof ActiveFormats)[]).every((k) => a[k] === b[k])
}

/**
 * Which formats apply at the caret / selection right now.
 * Updates when the caret moves; call refresh() right after running a command.
 */
export function useFormatState(editorRef: React.RefObject<HTMLDivElement | null>): {
    active: ActiveFormats
    refresh: () => void
} {
    const [active, setActive] = useState<ActiveFormats>(NONE)

    const refresh = useCallback((): void => {
        const editor = editorRef.current
        const sel = window.getSelection()
        const inside = !!editor && !!sel && sel.rangeCount > 0 && editor.contains(sel.anchorNode)
        const next = inside ? readFormats() : NONE
        setActive((prev) => (isSame(prev, next) ? prev : next))
    }, [editorRef])

    useEffect(() => {
        document.addEventListener('selectionchange', refresh)
        return () => document.removeEventListener('selectionchange', refresh)
    }, [refresh])

    return { active, refresh }
}
