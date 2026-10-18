import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { FolderKanban } from 'lucide-react'
import { Sidebar } from '../components/layout/Sidebar'
import { ProjectDetailView } from '../views/ProjectDetailView'
import { ROUTES } from '../lib/routes'

function ProjectDetailRoute(): React.JSX.Element {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const projectId = Number(id)

    if (!id || !Number.isInteger(projectId) || projectId <= 0) {
        return <Navigate to={ROUTES.projects} replace />
    }

    return <ProjectDetailView projectId={projectId} onDeleted={() => navigate(ROUTES.projects)} />
}

function EmptyProjectState(): React.JSX.Element {
    return (
        <div className="project-empty-state">
            <div className="project-empty-icon-wrap">
                <FolderKanban size={40} strokeWidth={1.5} />
            </div>
            <h2>No Project Selected</h2>
            <p>Select a project from the sidebar to view its details, tasks, and financials.</p>
            <span className="project-empty-hint">
                or click the <strong>+</strong> in the sidebar to create a new one.
            </span>
        </div>
    )
}

export function ProjectsSpace(): React.JSX.Element {
    return (
        <div className="space-layout">
            <Sidebar />
            <div className="main-area projects-main-area">
                <Routes>
                    <Route path=":id" element={<ProjectDetailRoute />} />
                    <Route index element={<EmptyProjectState />} />
                    <Route path="*" element={<Navigate to={ROUTES.projects} replace />} />
                </Routes>
            </div>
        </div>
    )
}
