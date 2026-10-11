import type { ElectronAPI } from '@electron-toolkit/preload'
import type { SynapsesAPI } from '../shared/api'

declare global {
    interface Window {
        electron: ElectronAPI
        api: SynapsesAPI
    }
}

export {}
