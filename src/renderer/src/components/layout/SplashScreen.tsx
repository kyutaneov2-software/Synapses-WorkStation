import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

interface SplashScreenProps {
    onComplete: () => void
}

const easeOut = [0.16, 1, 0.3, 1] as const

export function SplashScreen({ onComplete }: SplashScreenProps): React.JSX.Element {
    useEffect(() => {
        // Wait 1.8 seconds to let the app mount and data fetch in the background
        const timer = setTimeout(() => {
            onComplete()
        }, 1800)
        return () => clearTimeout(timer)
    }, [onComplete])

    return (
        <motion.div
            className="splash-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.02, filter: 'blur(4px)' }}
            transition={{ duration: 0.6, ease: easeOut }}
        >
            <div className="splash-content">
                <motion.div
                    className="splash-logo"
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.8, ease: easeOut, delay: 0.1 }}
                >
                    <div className="splash-icon-glow" />
                    <Zap size={32} strokeWidth={1.5} className="splash-icon" />
                </motion.div>

                <motion.h1
                    className="splash-title"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: easeOut, delay: 0.2 }}
                >
                    Synapses
                </motion.h1>

                <motion.div
                    className="splash-loader-track"
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ duration: 0.6, ease: easeOut, delay: 0.4 }}
                >
                    <motion.div
                        className="splash-loader-bar"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 1.4, ease: easeOut, delay: 0.5 }}
                    />
                </motion.div>
            </div>
        </motion.div>
    )
}
