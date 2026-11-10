import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { SynapsesMascot } from '../common/SynapsesMascot' // <--- Import

interface SplashScreenProps {
    onComplete: () => void
}

const easeOut = [0.16, 1, 0.3, 1] as const

export function SplashScreen({ onComplete }: SplashScreenProps): React.JSX.Element {
    useEffect(() => {
        const timer = setTimeout(() => onComplete(), 1800)
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
                    {/* Use the Mascot here instead of the old icon */}
                    <SynapsesMascot size={72} animated={true} />
                </motion.div>

                <motion.h1
                    className="splash-title"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: easeOut, delay: 0.2 }}
                >
                    Synapses
                </motion.h1>
                {/* ... loader track ... */}
            </div>
        </motion.div>
    )
}
