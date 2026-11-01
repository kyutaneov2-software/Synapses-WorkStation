import { useState } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { IconRail } from './components/layout/IconRail'
import { SplashScreen } from './components/layout/SplashScreen'
import { TasksSpace } from './spaces/TasksSpace'
import { ProjectsSpace } from './spaces/ProjectsSpace'
import { HomeSpace } from './spaces/HomeSpace'
import { NotesSpace } from './spaces/NotesSpace'
import { SettingsSpace } from './spaces/SettingsSpace'

function App(): React.JSX.Element {
    const [showSplash, setShowSplash] = useState(true)
    return (
        <HashRouter>
            <AnimatePresence>
                {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
            </AnimatePresence>

            <div className="app-shell">
                <IconRail />
                <div className="space-layout">
                    <Routes>
                        <Route path="/" element={<Navigate to="/tasks/today" replace />} />
                        <Route path="/tasks/*" element={<TasksSpace />} />
                        <Route path="/projects/*" element={<ProjectsSpace />} />
                        <Route
                            path="/commissions/*"
                            element={<Navigate to="/tasks/today" replace />}
                        />
                        <Route path="/home" element={<HomeSpace />} />
                        <Route path="/notes/*" element={<NotesSpace />} />
                        <Route path="/settings" element={<SettingsSpace />} />
                        <Route path="*" element={<Navigate to="/tasks/today" replace />} />
                    </Routes>
                </div>
            </div>
        </HashRouter>
    )
}

export default App
