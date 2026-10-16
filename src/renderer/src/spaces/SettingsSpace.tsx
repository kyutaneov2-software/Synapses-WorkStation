export function SettingsSpace(): React.JSX.Element {
    return (
        <div className="space-layout">
            <div className="main-area">
                <main className="content">
                    <div className="view">
                        <div className="view-header">
                            <h2>Settings</h2>
                        </div>
                        <button className="btn-ghost" onClick={() => window.api.testNotification()}>
                            Send test notification
                        </button>
                    </div>
                </main>
            </div>
        </div>
    )
}
