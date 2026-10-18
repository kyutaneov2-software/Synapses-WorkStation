import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { IconRail } from './components/layout/IconRail'
import { TasksSpace } from './spaces/TasksSpace'
import { ProjectsSpace } from './spaces/ProjectsSpace'
import { HomeSpace } from './spaces/HomeSpace'
import { NotesSpace } from './spaces/NotesSpace'
import { ScheduleSpace } from './spaces/ScheduleSpace'
import { GoalsSpace } from './spaces/GoalsSpace'
import { SettingsSpace } from './spaces/SettingsSpace'

function App(): React.JSX.Element {
    return (
        <HashRouter>
            <div className="app-shell">
                <IconRail />
                <Routes>
                    <Route path="/" element={<Navigate to="/tasks/today" replace />} />

                    {/* New Domains */}
                    <Route path="/tasks/*" element={<TasksSpace />} />
                    <Route path="/projects/*" element={<ProjectsSpace />} />

                    {/* Redirect old bookmarks */}
                    <Route path="/commissions/*" element={<Navigate to="/tasks/today" replace />} />

                    <Route path="/home" element={<HomeSpace />} />
                    <Route path="/notes/*" element={<NotesSpace />} />
                    <Route path="/schedule" element={<ScheduleSpace />} />
                    <Route path="/goals" element={<GoalsSpace />} />
                    <Route path="/settings" element={<SettingsSpace />} />
                    <Route path="*" element={<Navigate to="/tasks/today" replace />} />
                </Routes>
            </div>
        </HashRouter>
    )
}

export default App
