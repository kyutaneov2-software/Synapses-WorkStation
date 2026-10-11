import { Smartphone, Globe, Monitor, Video, Palette, FileText, Package } from 'lucide-react'
import type { ProjectType } from '../../../shared/constants'

export function projectTypeIcon(type: ProjectType | null, size = 14): React.JSX.Element {
    const props = { size, strokeWidth: 1.8 }
    switch (type) {
        case 'mobile_app':
            return <Smartphone {...props} />
        case 'website':
            return <Globe {...props} />
        case 'desktop_app':
            return <Monitor {...props} />
        case 'video':
            return <Video {...props} />
        case 'illustration':
            return <Palette {...props} />
        case 'writing':
            return <FileText {...props} />
        default:
            return <Package {...props} />
    }
}
