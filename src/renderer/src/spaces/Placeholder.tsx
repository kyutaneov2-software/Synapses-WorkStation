interface PlaceholderProps {
    title: string
    description?: string
}

export function Placeholder({ title, description }: PlaceholderProps): React.JSX.Element {
    return (
        <div className="space-layout">
            <div className="main-area">
                <div className="placeholder-view">
                    <h2>{title}</h2>
                    <p>{description ?? 'Coming soon.'}</p>
                </div>
            </div>
        </div>
    )
}
