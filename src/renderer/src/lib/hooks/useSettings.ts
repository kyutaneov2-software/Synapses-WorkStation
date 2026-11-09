import { useCallback, useEffect, useState } from 'react'
import type { AppSettings, SettingsPatch } from '../../../../shared/types'

/**
 * Fallback settings used while the initial IPC fetch is in flight.
 * Mirrors the defaults in the main process so the UI never flashes
 * an empty/light screen for a dark-themed app.
 */
const FALLBACK_SETTINGS: AppSettings = {
    launchOnStartup: true,
    theme: 'dark',
    accentColor: 'blue',
    username: '',
    defaultCurrency: 'USD',
    notificationsEnabled: true,
    minimizeToTrayOnClose: true,
    focusAlwaysOnTop: true
}

interface UseSettingsResult {
    settings: AppSettings
    loading: boolean
    updateSettings: (patch: SettingsPatch) => Promise<void>
}

export function useSettings(): UseSettingsResult {
    const [settings, setSettings] = useState<AppSettings>(FALLBACK_SETTINGS)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false

        // Initial fetch
        window.api
            .getSettings()
            .then((s) => {
                if (cancelled) return
                setSettings(s)
                setLoading(false)
            })
            .catch((e) => {
                console.error('[useSettings] initial load failed:', e)
                if (!cancelled) setLoading(false)
            })

        // Live updates from any window (main or Focus widget)
        const unsubscribe = window.api.onSettingsChanged((s) => {
            if (!cancelled) setSettings(s)
        })

        return () => {
            cancelled = true
            unsubscribe()
        }
    }, [])

    const updateSettings = useCallback(async (patch: SettingsPatch): Promise<void> => {
        // Optimistic update — the UI reacts instantly, the IPC roundtrip
        // then confirms with the authoritative resolved settings.
        setSettings((prev) => ({ ...prev, ...patch }))

        try {
            await window.api.updateSettings(patch)
        } catch (e) {
            console.error('[useSettings] update failed:', e)
            // Re-sync from main process to restore truth
            try {
                const fresh = await window.api.getSettings()
                setSettings(fresh)
            } catch {
                /* swallow — the user will see stale state but no crash */
            }
        }
    }, [])

    return { settings, loading, updateSettings }
}
