import { useCallback, useEffect, useRef, useState } from 'react'
import type { Note } from '../../../../shared/types'

const SAVE_DEBOUNCE_MS = 500
const SAVED_INDICATOR_MS = 1200

export type SaveState = 'idle' | 'saving' | 'saved'

interface NoteAutosave {
    saveState: SaveState
    /** Merge a change into the pending save and (re)start the debounce timer. */
    queueSave: (patch: Partial<Note>) => void
    /** Throw away anything not saved yet (use right before deleting the note). */
    discard: () => void
}

/**
 * Saves only what the user actually changed, only when they change it.
 * No diffing in an effect, so nothing gets written just because a note loaded.
 */
export function useNoteAutosave(noteId: number, onSaved: (note: Note) => void): NoteAutosave {
    const [saveState, setSaveState] = useState<SaveState>('idle')

    const aliveRef = useRef(true)
    const pendingRef = useRef<Partial<Note>>({})
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const indicatorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const onSavedRef = useRef(onSaved)

    useEffect(() => {
        onSavedRef.current = onSaved
    }, [onSaved])

    const flush = useCallback(async (): Promise<void> => {
        saveTimerRef.current = null
        const patch = pendingRef.current
        if (Object.keys(patch).length === 0) return
        pendingRef.current = {}

        setSaveState('saving')
        try {
            const updated = await window.api.updateNote(noteId, patch)
            if (!aliveRef.current) return
            onSavedRef.current(updated)
            setSaveState('saved')

            if (indicatorTimerRef.current) clearTimeout(indicatorTimerRef.current)
            indicatorTimerRef.current = setTimeout(() => {
                if (aliveRef.current) setSaveState('idle')
            }, SAVED_INDICATOR_MS)
        } catch (e) {
            console.error('[useNoteAutosave] save failed:', e)
            // Put the change back, but never over something newer.
            pendingRef.current = { ...patch, ...pendingRef.current }
            if (aliveRef.current) setSaveState('idle')
        }
    }, [noteId])

    const queueSave = useCallback(
        (patch: Partial<Note>): void => {
            pendingRef.current = { ...pendingRef.current, ...patch }
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
            saveTimerRef.current = setTimeout(() => {
                void flush()
            }, SAVE_DEBOUNCE_MS)
        },
        [flush]
    )

    const discard = useCallback((): void => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
        pendingRef.current = {}
    }, [])

    // On unmount: write whatever is still waiting, so switching notes never loses typing.
    useEffect(() => {
        aliveRef.current = true
        return () => {
            aliveRef.current = false
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
            if (indicatorTimerRef.current) clearTimeout(indicatorTimerRef.current)

            const leftover = pendingRef.current
            pendingRef.current = {}
            if (Object.keys(leftover).length > 0) {
                window.api.updateNote(noteId, leftover).catch((e) => {
                    console.error('[useNoteAutosave] unmount flush failed:', e)
                })
            }
        }
    }, [noteId])

    return { saveState, queueSave, discard }
}
