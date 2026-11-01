import { motion } from 'framer-motion'
import { TodayView } from '../views/TodayView'
import { TomorrowView } from '../views/TomorrowView'
import { AllTasksView } from '../views/AllTasksView'

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

export function TasksSpace(): React.JSX.Element {
    return (
        <div className="tasks-container">
            <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: easeOut }}
                className="dashboard-ribbon"
            >
                <div className="ribbon-greeting">
                    <h1>Tasks</h1>
                    <p>Your agenda — focus on today, plan for tomorrow.</p>
                </div>
            </motion.div>

            <motion.div
                className="tasks-dashboard-layout"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div className="tasks-column" variants={columnVariants}>
                    <TodayView />
                </motion.div>
                <motion.div className="tasks-column" variants={columnVariants}>
                    <TomorrowView />
                </motion.div>
                <motion.div className="tasks-column tasks-column-wide" variants={columnVariants}>
                    <AllTasksView />
                </motion.div>
            </motion.div>
        </div>
    )
}
