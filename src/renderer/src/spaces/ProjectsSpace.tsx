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
        <div
            className="empty-state"
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
            }}
        >
            <FolderKanban size={48} strokeWidth={1} style={{ opacity: 0.2, marginBottom: 16 }} />
            <h2 style={{ color: 'var(--text-0)', marginBottom: 8 }}>No Project Selected</h2>
            <p>Select a project from the sidebar or create a new one.</p>
        </div>
    )
}

export function ProjectsSpace(): React.JSX.Element {
    return (
        <div className="space-layout">
            <Sidebar />
            <div className="main-area">
                <main className="content">
                    <Routes>
                        <Route path=":id" element={<ProjectDetailRoute />} />
                        <Route index element={<EmptyProjectState />} />
                        <Route path="*" element={<Navigate to={ROUTES.projects} replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    )
}
