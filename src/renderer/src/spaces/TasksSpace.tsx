import { motion } from 'framer-motion'
import { TodayView } from '../views/TodayView'
import { TomorrowView } from '../views/TomorrowView'
import { AllTasksView } from '../views/AllTasksView'

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
        // Near-critical damping — smooth settle, no bounce
        transition: { type: 'spring', stiffness: 280, damping: 28 }
    }
} as const

export function TasksSpace(): React.JSX.Element {
    return (
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
    )
}
