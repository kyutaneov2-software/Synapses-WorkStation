import { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Trash2, UploadCloud, Image as ImageIcon, File } from 'lucide-react'
import { useLiveData } from '../../lib/hooks'
import type { Attachment } from '../../../../shared/types'

function formatSize(bytes: number | null): string {
    if (!bytes) return '—'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function ProjectFilesList({ projectId }: { projectId: number }): React.JSX.Element {
    const fetcher = useCallback(() => window.api.getAttachments(projectId), [projectId])
    const { data: files, loading } = useLiveData<Attachment[]>(fetcher, [])

    const handleUpload = async (): Promise<void> => {
        await window.api.addAttachments(projectId, 'Select project files')
    }

    const handleDelete = async (id: number, name: string): Promise<void> => {
        if (confirm(`Delete ${name}?`)) {
            await window.api.deleteAttachment(id)
        }
    }

    if (loading) return <p className="text-muted">Loading files…</p>

    return (
        <div className="project-files">
            <button className="files-upload-btn" onClick={handleUpload}>
                <UploadCloud size={18} />
                <div className="files-upload-text">
                    <strong>Upload Files</strong>
                    <span>Attach contracts, images, or assets</span>
                </div>
            </button>

            {files.length === 0 ? (
                <div className="empty-state-mini" style={{ marginTop: '24px' }}>
                    <p>No files attached to this project yet.</p>
                </div>
            ) : (
                <div className="files-grid">
                    <AnimatePresence mode="popLayout">
                        {files.map((f) => {
                            const isImage = f.mime_type?.startsWith('image/')
                            const isPdf = f.mime_type === 'application/pdf'

                            return (
                                <motion.div
                                    layout
                                    key={f.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="file-card"
                                >
                                    <div className="file-card-icon">
                                        {isImage ? (
                                            <ImageIcon size={24} />
                                        ) : isPdf ? (
                                            <FileText size={24} />
                                        ) : (
                                            <File size={24} />
                                        )}
                                    </div>
                                    <div className="file-card-info">
                                        <span className="file-name" title={f.original_name}>
                                            {f.original_name}
                                        </span>
                                        <span className="file-meta">{formatSize(f.size)}</span>
                                    </div>
                                    <div className="file-card-actions">
                                        <button
                                            className="file-btn open"
                                            onClick={() => window.api.openAttachment(f.filename)}
                                            title="Open file"
                                        >
                                            Open
                                        </button>
                                        <button
                                            className="file-btn delete"
                                            onClick={() => handleDelete(f.id, f.original_name)}
                                            title="Delete file"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}
