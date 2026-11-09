import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
    Sun,
    Moon,
    Monitor,
    Bell,
    FolderOpen,
    AppWindow,
    User,
    Palette,
    Shield,
    CheckCircle2
} from 'lucide-react'
import { useSettings } from '../lib/hooks'
import type { Theme, AccentColor, SystemInfo, SettingsPatch } from '../../../shared/types'

const easeOut = [0.16, 1, 0.3, 1] as const

const ACCENT_OPTIONS: { id: AccentColor; label: string; hex: string }[] = [
    { id: 'blue', label: 'Blue', hex: '#5c8ff7' },
    { id: 'ember', label: 'Ember', hex: '#e8a65d' },
    { id: 'violet', label: 'Violet', hex: '#a78bfa' },
    { id: 'emerald', label: 'Emerald', hex: '#22c55e' },
    { id: 'rose', label: 'Rose', hex: '#f472b6' }
]

const THEME_OPTIONS: { id: Theme; label: string; icon: typeof Sun }[] = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor }
]

const CURRENCIES = [
    { code: 'USD', label: 'US Dollar' },
    { code: 'EUR', label: 'Euro' },
    { code: 'GBP', label: 'British Pound' },
    { code: 'PHP', label: 'Philippine Peso' },
    { code: 'JPY', label: 'Japanese Yen' },
    { code: 'CAD', label: 'Canadian Dollar' },
    { code: 'AUD', label: 'Australian Dollar' },
    { code: 'SGD', label: 'Singapore Dollar' },
    { code: 'INR', label: 'Indian Rupee' },
    { code: 'BRL', label: 'Brazilian Real' }
]

interface ToggleProps {
    label: string
    description?: string
    checked: boolean
    onChange: (v: boolean) => void
}

function Toggle({ label, description, checked, onChange }: ToggleProps): React.JSX.Element {
    return (
        <button
            type="button"
            className="settings-toggle"
            onClick={() => onChange(!checked)}
            role="switch"
            aria-checked={checked}
        >
            <div className="settings-toggle-label">
                <strong>{label}</strong>
                {description && <span>{description}</span>}
            </div>
            <span className="settings-switch" data-checked={checked} />
        </button>
    )
}

export function SettingsSpace(): React.JSX.Element {
    const { settings, loading, updateSettings } = useSettings()
    const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
    const [testSent, setTestSent] = useState(false)
    const [saveFlash, setSaveFlash] = useState(false)

    useEffect(() => {
        window.api
            .getSystemInfo()
            .then(setSystemInfo)
            .catch((e) => console.error('[Settings] getSystemInfo failed:', e))
    }, [])

    // Wrapper to show the "Saved" toast
    const handleUpdate = async (patch: SettingsPatch): Promise<void> => {
        await updateSettings(patch)
        setSaveFlash(true)
        setTimeout(() => setSaveFlash(false), 2000)
    }

    const handleTestNotification = async (): Promise<void> => {
        try {
            await window.api.testNotification()
            setTestSent(true)
            setTimeout(() => setTestSent(false), 2000)
        } catch (e) {
            console.error('[Settings] test notification failed:', e)
        }
    }

    const handleReset = async (): Promise<void> => {
        try {
            const res = await window.api.resetSettings()
            if (res) {
                setSaveFlash(true)
                setTimeout(() => setSaveFlash(false), 2000)
            }
        } catch (e) {
            console.error('[Settings] reset failed:', e)
        }
    }

    if (loading) {
        return (
            <div className="settings-container">
                <p style={{ color: 'var(--text-3)' }}>Loading…</p>
            </div>
        )
    }

    return (
        <div className="settings-container">
            <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: easeOut }}
                className="dashboard-ribbon"
            >
                <div className="ribbon-greeting">
                    <h1>Settings</h1>
                    <p>Customize your workstation — appearance, profile, and preferences.</p>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05, ease: easeOut }}
                className="settings-grid"
            >
                {/* ── APPEARANCE ──────────────────────────────── */}
                <section className="settings-card">
                    <div className="settings-card-header">
                        <Palette size={14} />
                        <span>Appearance</span>
                    </div>

                    <div className="settings-section">
                        <label className="settings-label">Theme</label>
                        <div className="theme-segmented">
                            {THEME_OPTIONS.map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    className={`theme-option ${settings.theme === id ? 'active' : ''}`}
                                    onClick={() => handleUpdate({ theme: id })}
                                >
                                    <Icon size={14} />
                                    <span>{label}</span>
                                </button>
                            ))}
                        </div>
                        <p className="settings-help">
                            System follows your OS light/dark preference automatically.
                        </p>
                    </div>

                    <div className="settings-section">
                        <label className="settings-label">Accent Color</label>
                        <div className="accent-swatches">
                            {ACCENT_OPTIONS.map((opt) => (
                                <button
                                    key={opt.id}
                                    className={`accent-swatch ${settings.accentColor === opt.id ? 'active' : ''}`}
                                    onClick={() => handleUpdate({ accentColor: opt.id })}
                                    title={opt.label}
                                    aria-label={`Accent: ${opt.label}`}
                                    style={{ background: opt.hex }}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── PROFILE ─────────────────────────────────── */}
                <section className="settings-card">
                    <div className="settings-card-header">
                        <User size={14} />
                        <span>Profile</span>
                    </div>

                    <div className="settings-section">
                        <label className="settings-label">Your Name</label>
                        <input
                            type="text"
                            className="settings-input"
                            placeholder="e.g. Alex"
                            value={settings.username}
                            onChange={(e) => handleUpdate({ username: e.target.value })}
                            maxLength={50}
                        />
                        <p className="settings-help">
                            Greetings on the dashboard will use this name.
                        </p>
                    </div>

                    <div className="settings-section">
                        <label className="settings-label">Default Currency</label>
                        <select
                            className="settings-select"
                            value={settings.defaultCurrency}
                            onChange={(e) => handleUpdate({ defaultCurrency: e.target.value })}
                        >
                            {CURRENCIES.map((c) => (
                                <option key={c.code} value={c.code}>
                                    {c.code} — {c.label}
                                </option>
                            ))}
                        </select>
                        <p className="settings-help">
                            Used for dashboard totals when projects have mixed currencies.
                        </p>
                    </div>
                </section>

                {/* ── PREFERENCES ─────────────────────────────── */}
                <section className="settings-card settings-card-preferences">
                    <div className="settings-card-header">
                        <Shield size={14} />
                        <span>Preferences</span>
                    </div>

                    <div className="settings-toggle-grid">
                        <Toggle
                            label="Launch on Startup"
                            description="Start Synapses when you log in"
                            checked={settings.launchOnStartup}
                            onChange={(v) => handleUpdate({ launchOnStartup: v })}
                        />
                        <Toggle
                            label="Minimize to Tray on Close"
                            description="Keep running in the background"
                            checked={settings.minimizeToTrayOnClose}
                            onChange={(v) => handleUpdate({ minimizeToTrayOnClose: v })}
                        />
                        <Toggle
                            label="Desktop Notifications"
                            description="Alerts for deadlines and milestones"
                            checked={settings.notificationsEnabled}
                            onChange={(v) => handleUpdate({ notificationsEnabled: v })}
                        />
                        <Toggle
                            label="Focus Widget Always on Top"
                            description="Keep the widget above other windows"
                            checked={settings.focusAlwaysOnTop}
                            onChange={(v) => handleUpdate({ focusAlwaysOnTop: v })}
                        />
                    </div>
                </section>

                {/* ── SYSTEM ──────────────────────────────────── */}
                <section className="settings-card settings-card-system">
                    <div className="settings-card-header">
                        <AppWindow size={14} />
                        <span>System</span>
                    </div>

                    <div className="settings-actions">
                        <button
                            className="btn-ghost"
                            onClick={handleTestNotification}
                            disabled={!settings.notificationsEnabled}
                            title={
                                !settings.notificationsEnabled
                                    ? 'Notifications are disabled above'
                                    : undefined
                            }
                        >
                            <Bell size={14} />
                            {testSent ? 'Notification Sent!' : 'Send Test Notification'}
                        </button>
                        <button
                            className="btn-ghost"
                            onClick={() =>
                                window.api
                                    .openUserDataFolder()
                                    .catch((e) =>
                                        console.error('[Settings] open folder failed:', e)
                                    )
                            }
                        >
                            <FolderOpen size={14} />
                            Open App Data Folder
                        </button>
                    </div>

                    <div className="settings-danger-zone">
                        <button className="btn-danger" onClick={handleReset}>
                            Reset to Defaults
                        </button>
                    </div>

                    {systemInfo && (
                        <div className="settings-version">
                            <span className="settings-version-label">Synapses WorkStation</span>
                            <span className="settings-version-value" data-tabular>
                                v{systemInfo.version}
                            </span>
                        </div>
                    )}
                </section>
            </motion.div>

            {/* ── SAVED TOAST ─────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: saveFlash ? 1 : 0, y: saveFlash ? 0 : 10 }}
                transition={{ duration: 0.2 }}
                className="settings-toast"
                style={{ pointerEvents: 'none' }}
            >
                <CheckCircle2 size={14} />
                Settings Saved
            </motion.div>
        </div>
    )
}
