import { useEffect, useLayoutEffect } from 'react'
import { useSettings } from '../../lib/hooks'
import type { Theme } from '../../../../shared/types'

const THEME_CACHE_KEY = 'synapses.theme'
const ACCENT_CACHE_KEY = 'synapses.accent'

function resolveEffectiveTheme(theme: Theme): 'dark' | 'light' {
    if (theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme
}

/**
 * Applies the user's theme and accent preference to the DOM.
 * Runs in BOTH the main window and the Focus widget.
 *
 * Strategy:
 *  1. Fast path (useLayoutEffect) reads localStorage synchronously on
 *     first paint so there's no dark→light flash on reload.
 *  2. Slow path (useEffect) syncs with the authoritative settings once
 *     the IPC fetch resolves, and listens for system theme changes.
 *  3. Every settings change is written back to localStorage as a cache.
 */
export function ThemeMount(): null {
    const { settings, loading } = useSettings()

    // ── Fast path: cached theme applied BEFORE first paint ────────────
    useLayoutEffect(() => {
        const cachedTheme = localStorage.getItem(THEME_CACHE_KEY)
        const cachedAccent = localStorage.getItem(ACCENT_CACHE_KEY)
        if (cachedTheme) {
            document.documentElement.dataset.theme = cachedTheme
        }
        if (cachedAccent) {
            document.documentElement.dataset.accent = cachedAccent
        }
    }, [])

    // ── Slow path: authoritative theme from settings ──────────────────
    useEffect(() => {
        if (loading) return undefined

        const effective = resolveEffectiveTheme(settings.theme)
        document.documentElement.dataset.theme = effective
        document.documentElement.dataset.accent = settings.accentColor

        localStorage.setItem(THEME_CACHE_KEY, effective)
        localStorage.setItem(ACCENT_CACHE_KEY, settings.accentColor)

        // Only subscribe to system changes when the user chose 'system'
        if (settings.theme !== 'system') {
            return undefined
        }

        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        const handler = (): void => {
            const next = mq.matches ? 'dark' : 'light'
            document.documentElement.dataset.theme = next
            localStorage.setItem(THEME_CACHE_KEY, next)
        }
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [settings.theme, settings.accentColor, loading])

    return null
}
