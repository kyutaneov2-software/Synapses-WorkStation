type View = "today" | "tomorrow" | "projects" | "all" | "dashboard";

interface HeaderProps {
    activeView: View;
    onNavigate: (view: View) => void;
}

export function Header({
    activeView,
    onNavigate,
}: HeaderProps): React.JSX.Element {
    const tabs: { key: View; label: string }[] = [
        { key: "today", label: "Today" },
        { key: "tomorrow", label: "Tomorrow" },
        { key: "projects", label: "Projects" },
        { key: "all", label: "All Tasks" },
        { key: "dashboard", label: "$ Dashboard" },
    ];

    return (
        <header className="topbar">
            <div className="topbar-tabs">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        className={activeView === t.key ? "active" : ""}
                        onClick={() => onNavigate(t.key)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>
            <button
                className="focus-toggle"
                onClick={() => window.api.focusToggle()}
                title="Toggle Focus window (Ctrl+Shift+F)"
            >
                ⚡ Focus
            </button>
        </header>
    );
}
