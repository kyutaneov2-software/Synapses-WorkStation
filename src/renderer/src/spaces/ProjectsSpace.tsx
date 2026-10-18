import { Navigate, Route, Routes, useNavigate, useParams, useLocation } from 'react-router-dom'
import { FolderKanban } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
    const location = useLocation()

    return (
        <div className="space-layout">
            <Sidebar />
            <div className="main-area projects-main-area">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 10, scale: 0.99 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.99 }}
                        transition={{ duration: 0.2 }}
                        className="projects-content-wrapper"
                    >
                        <Routes location={location}>
                            <Route path=":id" element={<ProjectDetailRoute />} />
                            <Route index element={<EmptyProjectState />} />
                            <Route path="*" element={<Navigate to={ROUTES.projects} replace />} />
                        </Routes>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}
