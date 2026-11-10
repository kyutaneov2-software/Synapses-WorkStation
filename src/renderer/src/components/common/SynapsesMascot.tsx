import { useId } from 'react'
import { motion } from 'framer-motion'

interface MascotProps {
    size?: number
    animated?: boolean
}

// Coordinates taken from the logo artwork (viewBox 0 0 837 862)
const nodes = [
    { x: 196, y: 330, r: 34, type: 'outer' },
    { x: 386, y: 430, r: 58, type: 'core' }, // core
    { x: 320, y: 624, r: 34, type: 'outer' },
    { x: 557, y: 267, r: 47, type: 'outer' },
    { x: 638, y: 484, r: 34, type: 'purple' }
]

// Pairs of node indices to connect
const links: [number, number][] = [
    [0, 1],
    [1, 3],
    [1, 2],
    [3, 4]
]

const PULSE_LEN = 90 // length of the traveling light, in px
const PULSE_TIME = 2.2 // seconds for a pulse to cross one link

function linkLength(a: number, b: number): number {
    const A = nodes[a]
    const B = nodes[b]
    return Math.hypot(B.x - A.x, B.y - A.y)
}

export function SynapsesMascot({ size = 64, animated = true }: MascotProps): React.JSX.Element {
    // useId contains colons, which break url(#id) references, so strip them
    const glowId = 'glow-' + useId().replace(/:/g, '')

    return (
        <div style={{ width: size, height: size, display: 'flex' }}>
            <svg viewBox="0 0 837 862" width="100%" height="100%" style={{ display: 'block' }}>
                <defs>
                    <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="12" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/*
                  Premium Glass Background
                  Uses the theme's base card color with a subtle border
                */}
                <rect
                    x="12"
                    y="36"
                    width="813"
                    height="790"
                    rx="170"
                    fill="var(--bg-1)"
                    stroke="var(--border)"
                    strokeWidth="8"
                />

                {/* Static connecting lines */}
                <g
                    stroke="var(--accent)"
                    strokeOpacity="0.25"
                    strokeWidth="14"
                    strokeLinecap="round"
                    fill="none"
                >
                    {links.map(([a, b], i) => (
                        <line
                            key={i}
                            x1={nodes[a].x}
                            y1={nodes[a].y}
                            x2={nodes[b].x}
                            y2={nodes[b].y}
                        />
                    ))}
                </g>

                {/* Signal pulses travelling along each link */}
                {animated && (
                    <g
                        filter={`url(#${glowId})`}
                        stroke="var(--accent-hover)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        fill="none"
                    >
                        {links.map(([a, b], i) => {
                            const len = linkLength(a, b)
                            const period = len + PULSE_LEN
                            return (
                                <motion.line
                                    key={i}
                                    x1={nodes[a].x}
                                    y1={nodes[a].y}
                                    x2={nodes[b].x}
                                    y2={nodes[b].y}
                                    strokeDasharray={`${PULSE_LEN} ${len}`}
                                    initial={{ strokeDashoffset: 0 }}
                                    animate={{ strokeDashoffset: -period }}
                                    transition={{
                                        duration: PULSE_TIME,
                                        repeat: Infinity,
                                        ease: 'linear',
                                        delay: i * 0.6
                                    }}
                                />
                            )
                        })}
                    </g>
                )}

                {/* Glowing nodes */}
                <g filter={`url(#${glowId})`}>
                    {nodes.map((n, i) => {
                        const isCore = n.type === 'core'
                        const isPurple = n.type === 'purple'

                        return (
                            <g key={i}>
                                {/* Inner dark circle for the core to give it depth */}
                                {isCore && (
                                    <motion.circle
                                        cx={n.x}
                                        cy={n.y}
                                        r={n.r - 12}
                                        fill="var(--bg-0)"
                                        animate={animated ? { scale: [1, 1.05, 1] } : {}}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: 'easeInOut'
                                        }}
                                        style={{ transformOrigin: `${n.x}px ${n.y}px` }}
                                    />
                                )}

                                {/* Main node */}
                                <motion.circle
                                    cx={n.x}
                                    cy={n.y}
                                    r={isCore ? n.r : n.r - 8}
                                    fill={isPurple ? 'var(--purple)' : 'var(--accent)'}
                                    animate={
                                        animated
                                            ? { scale: isCore ? [1, 1.03, 1] : [1, 1.08, 1] }
                                            : {}
                                    }
                                    transition={{
                                        duration: isCore ? 3 : 2.2,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                        delay: i * 0.35
                                    }}
                                    style={{ transformOrigin: `${n.x}px ${n.y}px` }}
                                />

                                {/* Inner highlight for the core node */}
                                {isCore && (
                                    <motion.circle
                                        cx={n.x}
                                        cy={n.y}
                                        r={8}
                                        fill="var(--accent-hover)"
                                        animate={animated ? { opacity: [0.5, 1, 0.5] } : {}}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: 'easeInOut'
                                        }}
                                    />
                                )}
                            </g>
                        )
                    })}
                </g>
            </svg>
        </div>
    )
}
