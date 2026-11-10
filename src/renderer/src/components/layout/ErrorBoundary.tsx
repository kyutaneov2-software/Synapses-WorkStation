import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('[ErrorBoundary] Uncaught error:', error, errorInfo)
    }

    public render(): ReactNode {
        if (this.state.hasError) {
            return (
                <div className="error-boundary-screen">
                    <div className="error-boundary-card">
                        <div className="error-boundary-icon">
                            <AlertTriangle size={32} />
                        </div>
                        <h1>Something went wrong</h1>
                        <p>
                            Synapses hit an unexpected error. Your data is safe, but the interface
                            needs to restart.
                        </p>
                        <pre className="error-boundary-trace">{this.state.error?.message}</pre>
                        <button className="btn-primary" onClick={() => window.location.reload()}>
                            <RotateCcw size={16} />
                            Reload Application
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
