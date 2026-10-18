import { Navigate, Route, Routes } from 'react-router-dom'
import { SubNav } from '../components/layout/SubNav'
import { TodayView } from '../views/TodayView'
import { TomorrowView } from '../views/TomorrowView'
import { AllTasksView } from '../views/AllTasksView'

export function TasksSpace(): React.JSX.Element {
    return (
        <div className="space-layout">
            <div className="main-area">
                <SubNav />
                <main className="content">
                    <Routes>
                        <Route path="today" element={<TodayView />} />
                        <Route path="tomorrow" element={<TomorrowView />} />
                        <Route path="all" element={<AllTasksView />} />
                        <Route index element={<Navigate to="today" replace />} />
                        <Route path="*" element={<Navigate to="today" replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    )
}
