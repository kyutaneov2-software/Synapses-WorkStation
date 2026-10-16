import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { Sidebar } from '../components/layout/Sidebar'
import { SubNav } from '../components/layout/SubNav'
import { TodayView } from '../views/TodayView'
import { TomorrowView } from '../views/TomorrowView'
import { AllTasksView } from '../views/AllTasksView'
import { ProjectDetailView } from '../views/ProjectDetailView'
import { ROUTES } from '../lib/routes'

function ProjectDetailRoute(): React.JSX.Element {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const projectId = Number(id)

    if (!id || !Number.isInteger(projectId) || projectId <= 0) {
        return <Navigate to={ROUTES.commissionsToday} replace />
    }

    return (
        <ProjectDetailView
            projectId={projectId}
            onDeleted={() => navigate(ROUTES.commissionsToday)}
        />
    )
}

export function CommissionsSpace(): React.JSX.Element {
    return (
        <div className="space-layout">
            <Sidebar />
            <div className="main-area">
                <SubNav />
                <main className="content">
                    <Routes>
                        <Route path="today" element={<TodayView />} />
                        <Route path="tomorrow" element={<TomorrowView />} />
                        <Route path="all" element={<AllTasksView />} />
                        <Route path="project/:id" element={<ProjectDetailRoute />} />
                        <Route index element={<Navigate to="today" replace />} />
                        <Route path="*" element={<Navigate to="today" replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    )
}
