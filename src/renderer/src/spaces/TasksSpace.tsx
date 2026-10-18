import { TodayView } from '../views/TodayView'
import { TomorrowView } from '../views/TomorrowView'
import { AllTasksView } from '../views/AllTasksView'

export function TasksSpace(): React.JSX.Element {
    return (
        <div className="tasks-dashboard-layout">
            <div className="tasks-column">
                <TodayView />
            </div>
            <div className="tasks-column">
                <TomorrowView />
            </div>
            <div className="tasks-column tasks-column-wide">
                <AllTasksView />
            </div>
        </div>
    )
}
