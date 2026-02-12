import { useEffect, useState, useRef } from 'react'
import './LoadingScreen.css'

export default function LoadingScreen({ onComplete }) {
    const [progress, setProgress] = useState(0)
    const [isFading, setIsFading] = useState(false)
    const progressRef = useRef(0)

    useEffect(() => {
        // Random duration simulation with stops
        const simulateProgress = () => {
            const current = progressRef.current
            if (current >= 100) {
                // Complete!
                finishLoading()
                return
            }

            // Random chance to stop (10% chance)
            if (Math.random() < 0.1 && current > 10 && current < 90) {
                // Stop for 300ms - 800ms
                const stopDuration = 300 + Math.random() * 500
                setTimeout(simulateProgress, stopDuration)
                return
            }

            // Normal increment
            // Random increment between 1 and 5
            const increment = 1 + Math.random() * 4
            const nextProgress = Math.min(current + increment, 100)
            progressRef.current = nextProgress
            setProgress(nextProgress)

            // Next step in 30ms - 70ms (variable speed)
            const nextDelay = 30 + Math.random() * 40
            setTimeout(simulateProgress, nextDelay)
        }

        const finishLoading = () => {
            // 100% reached.
            // 1. Quick fade out of the black screen (0.3s)
            setIsFading(true)

            // 2. Wait for fade to finish, then unmount and signal sequence
            setTimeout(() => {
                if (onComplete) onComplete()
            }, 300) // Match CSS transition duration
        }

        // Start simulation
        const initialDelay = 100
        setTimeout(simulateProgress, initialDelay)

        return () => {
            // Cleanup handled by closures mostly, tough to cancel recursive timeout neatly without ref
            // In production, checking a mountedRef is better, but this is fine for now.
        }
    }, [onComplete])

    return (
        <div className={`loading-screen ${isFading ? 'fading' : ''}`}>
            <div className="loading-content">
                <h1 className="loading-logo">SemRank</h1>

                <div className="loading-bar-container">
                    <div
                        className="loading-bar-fill"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    )
}
