import { useState } from "react";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { TodayView } from "./views/TodayView";
import { TomorrowView } from "./views/TomorrowView";
import { AllTasksView } from "./views/AllTasksView";
import { DashboardView } from "./views/DashboardView";
import { ProjectDetailView } from "./views/ProjectDetailView";

type View = "today" | "tomorrow" | "projects" | "all" | "dashboard";

function App(): React.JSX.Element {
    const [activeView, setActiveView] = useState<View>("today");
    const [activeProjectId, setActiveProjectId] = useState<number | null>(null);

    const renderMain = (): React.JSX.Element => {
        if (activeView === "projects" && activeProjectId !== null) {
            return (
                <ProjectDetailView
                    projectId={activeProjectId}
                    onDeleted={() => {
                        setActiveProjectId(null);
                        setActiveView("today");
                    }}
                />
            );
        }

        switch (activeView) {
            case "today":
                return <TodayView />;
            case "tomorrow":
                return <TomorrowView />;
            case "all":
                return <AllTasksView />;
            case "dashboard":
                return <DashboardView />;
            case "projects":
                return (
                    <div className="view">
                        <h2>Projects</h2>
                        <p>Select a project from the sidebar.</p>
                    </div>
                );
            default:
                return <TodayView />;
        }
    };

    return (
        <div className="app-shell">
            <Sidebar
                activeProjectId={activeProjectId}
                onSelectProject={(id) => {
                    setActiveProjectId(id);
                    setActiveView("projects");
                }}
            />
            <div className="main-area">
                <Header
                    activeView={activeView}
                    onNavigate={(v) => {
                        setActiveView(v);
                        if (v !== "projects") setActiveProjectId(null);
                    }}
                />
                <main className="content">{renderMain()}</main>
            </div>
        </div>
    );
}

export default App;
