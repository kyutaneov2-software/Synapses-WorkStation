import { DashboardView } from '../views/DashboardView'

export function HomeSpace(): React.JSX.Element {
    return (
        <div className="space-layout">
            <div className="main-area">
                <main className="content">
                    <DashboardView />
                </main>
            </div>
        </div>
    )
}
