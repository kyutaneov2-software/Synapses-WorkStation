import { Navigate, Route, Routes, useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from '../components/layout/Sidebar'
import { ProjectDetailView } from '../views/ProjectDetailView'
import { ROUTES } from '../lib/routes'
import { SynapsesMascot } from '../components/common/SynapsesMascot'

const easeOut = [0.16, 1, 0.3, 1] as const

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.06 }
    }
}

const columnVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 280, damping: 28 }
    }
} as const

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
            <div
                className="project-empty-icon-wrap"
                style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
            >
                <SynapsesMascot size={80} animated={true} />
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
        <div className="projects-container">
            <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: easeOut }}
                className="dashboard-ribbon"
            >
                <div className="ribbon-greeting">
                    <h1>Projects</h1>
                    <p>Manage your commissions, tasks, and milestones.</p>
                </div>
            </motion.div>

            <motion.div
                className="projects-layout"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={columnVariants} style={{ display: 'flex' }}>
                    <Sidebar />
                </motion.div>

                <motion.div variants={columnVariants} className="projects-main-area">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.995 }}
                            transition={{ duration: 0.22, ease: easeOut }}
                            className="projects-content-wrapper"
                        >
                            <Routes location={location}>
                                <Route path=":id" element={<ProjectDetailRoute />} />
                                <Route index element={<EmptyProjectState />} />
                                <Route
                                    path="*"
                                    element={<Navigate to={ROUTES.projects} replace />}
                                />
                            </Routes>
                        </motion.div>
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </div>
    )
}
