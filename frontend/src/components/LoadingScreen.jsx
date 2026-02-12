import { useEffect, useState, useRef } from 'react'
import './LoadingScreen.css'

export default function LoadingScreen({ onComplete }) {
    const [progress, setProgress] = useState(0)
    const [isFading, setIsFading] = useState(false)
    const timerRef = useRef(null)

    useEffect(() => {
        // Random duration logic: 
        // We want to simulate progress reaching 100 within a random timeframe (e.g. 1.5s to 3s)
        // We'll increment progress in random chunks at fixed intervals.

        // Total duration target: 1500ms to 3000ms
        const totalDuration = Math.random() * 1500 + 1500
        const updateInterval = 50 // Update every 50ms
        const steps = totalDuration / updateInterval
        const avgIncrement = 100 / steps

        let currentProgress = 0

        timerRef.current = setInterval(() => {
            // Add randomness to increment
            const increment = avgIncrement * (0.5 + Math.random())
            currentProgress += increment

            if (currentProgress >= 100) {
                currentProgress = 100
                clearInterval(timerRef.current)

                // Slight pause at 100%
                setTimeout(() => {
                    // Signal App to un-blur content
                    if (onReveal) onReveal()

                    // Start fading out the overlay
                    setIsFading(true)

                    // Wait for CSS transition (0.8s) to finish before unmounting
                    setTimeout(() => {
                        if (onComplete) onComplete()
                    }, 800)
                }, 200)
            }

            setProgress(currentProgress)
        }, updateInterval * (0.8 + Math.random() * 0.4)) // Random interval fluctuation too for extra natural feel

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [onComplete, onReveal])

    return (
        <div className={`loading-screen ${isFading ? 'hidden' : ''}`}>
            <div className="loading-bar-container">
                <div
                    className="loading-bar-fill"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    )
}
