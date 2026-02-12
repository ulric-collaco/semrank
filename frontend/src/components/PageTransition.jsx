import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

/**
 * Wraps a page in a fade-in so lazy-loaded pages don't "flash" when
 * Suspense switches from the fallback to the real content.
 */
export default function PageTransition({ children }) {
    const ref = useRef(null)

    useEffect(() => {
        if (ref.current) {
            gsap.fromTo(
                ref.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.35, ease: 'power2.out' }
            )
        }
    }, [])

    return (
        <div ref={ref} style={{ opacity: 0 }}>
            {children}
        </div>
    )
}
